import { act, fireEvent, screen } from '@testing-library/react-native';
import { ownShare, personBalances } from '@/lib/domain/expenses';
import { renderWithProviders } from '@/test/render';
import { TransactionSheet } from '../../entry/TransactionSheet';
import { useExpenseStore } from '../../state/expenseStore';
import { useTransactionForm } from '../../state/transactionForm';
import { SettleSheet } from '../SettleSheet';

const store = () => useExpenseStore.getState();

beforeEach(() => {
  store().resetPreview();
  useTransactionForm.setState({
    open: false,
    editingId: null,
    active: null,
    errors: {},
    last: { kind: 'expense', accountId: null },
  });
});

describe('splitting an expense', () => {
  it('saves shares for the chosen people and counts only your share', async () => {
    await renderWithProviders(<TransactionSheet />);
    await act(() => useTransactionForm.getState().openNew());
    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '1500');
    await fireEvent.press(screen.getByRole('button', { name: 'Food' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Food, no subcategory' }));
    await fireEvent.press(screen.getByRole('button', { name: /^Cash, balance/ }));
    await act(() => useTransactionForm.getState().setActive('split'));
    await fireEvent.press(screen.getByRole('button', { name: 'Split with Arun' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Split with Meera' }));
    // Equal with you by default.
    expect(screen.getByText('Your share ₹500 · they owe you ₹1,000')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Note'), 'Team dinner');
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    const saved = store().transactions.find((item) => item.note === 'Team dinner')!;
    expect(saved.splits).toEqual([
      { personId: 'person-arun', amount: 50_000 },
      { personId: 'person-meera', amount: 50_000 },
    ]);
    expect(ownShare(saved)).toBe(50_000);
  });

  it('keeps equal shares in step with the amount', async () => {
    await renderWithProviders(<TransactionSheet />);
    await act(() => useTransactionForm.getState().openNew());
    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '900');
    await act(() => useTransactionForm.getState().setActive('split'));
    await fireEvent.press(screen.getByRole('button', { name: 'Split with Arun' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Split with Meera' }));
    expect(screen.getByLabelText("Arun's share in rupees").props.value).toBe('300');
    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '1200');
    expect(screen.getByLabelText("Arun's share in rupees").props.value).toBe('400');
    await fireEvent.press(screen.getByRole('radio', { name: 'They pay all' }));
    expect(screen.getByLabelText("Meera's share in rupees").props.value).toBe('600');
  });

  it('switches to custom when a share is typed, and checks the total', async () => {
    await renderWithProviders(<TransactionSheet />);
    await act(() => useTransactionForm.getState().openNew());
    await fireEvent.changeText(screen.getByLabelText('Amount in rupees'), '1000');
    await act(() => useTransactionForm.getState().setActive('split'));
    await fireEvent.press(screen.getByRole('button', { name: 'Split with Arun' }));
    await fireEvent.changeText(screen.getByLabelText("Arun's share in rupees"), '700');
    expect(useTransactionForm.getState().draft.splitMode).toBe('custom');
    // Your share starts as what is left, so it adds up.
    expect(screen.getByLabelText('Your share in rupees').props.value).toBe('300');
    expect(screen.getByText('Adds up to ₹1,000 · they owe you ₹700')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Your share in rupees'), '200');
    expect(screen.getByText('₹100 left to assign of ₹1,000')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Rest to me' }));
    expect(screen.getByLabelText('Your share in rupees').props.value).toBe('300');
  });

  it('adds a new person from the split panel', async () => {
    await renderWithProviders(<TransactionSheet />);
    await act(() => useTransactionForm.getState().openNew());
    await act(() => useTransactionForm.getState().setActive('split'));
    await fireEvent.press(screen.getByRole('button', { name: 'Add a person' }));
    await fireEvent.changeText(screen.getByLabelText("New person's name"), 'Karthik');
    await fireEvent.press(screen.getByRole('button', { name: 'Add and split' }));
    const karthik = store().people.find((person) => person.name === 'Karthik')!;
    expect(useTransactionForm.getState().draft.splits).toEqual([
      { personId: karthik.id, amountText: '' },
    ]);
  });
});

describe('SettleSheet', () => {
  it('records a repayment into the chosen account and settles the share', async () => {
    const before = personBalances(store().people, store().transactions)[0];
    expect(before.outstanding).toBeGreaterThan(0);
    await renderWithProviders(<SettleSheet balance={before} visible onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: /^Main bank, balance/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as paid' }));
    const after = personBalances(store().people, store().transactions)[0];
    expect(after.outstanding).toBe(0);
    expect(after.repayments[0]).toMatchObject({ accountId: 'acc-main', personId: 'person-arun' });
  });

  it('refuses more than they owe and asks for an account', async () => {
    const balance = personBalances(store().people, store().transactions)[0];
    await renderWithProviders(<SettleSheet balance={balance} visible onClose={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as paid' }));
    expect(screen.getByText('Choose the account the money went to.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Amount paid'), '999999');
    await fireEvent.press(screen.getByRole('button', { name: 'Mark as paid' }));
    expect(screen.getByText(/Arun owes/)).toBeTruthy();
  });
});
