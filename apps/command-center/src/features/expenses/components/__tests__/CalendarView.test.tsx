import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test/render';
import { useExpenseStore } from '../../state/expenseStore';
import { useTransactionForm } from '../../state/transactionForm';
import { CalendarView } from '../CalendarView';

beforeEach(() => {
  useExpenseStore.getState().resetPreview();
  useTransactionForm.setState({ open: false, editingId: null });
});

describe('CalendarView', () => {
  it('opens Add on the tapped day and selects that day', async () => {
    await renderWithProviders(<CalendarView fill={false} />);
    const days = screen.getAllByRole('button');
    await fireEvent.press(days[10]);
    const form = useTransactionForm.getState();
    expect(form.open).toBe(true);
    expect(form.editingId).toBeNull();
    expect(screen.getAllByRole('button')[10].props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getAllByRole('button')[10].props.accessibilityLabel).toContain(
      new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(`${form.draft.date}T12:00:00`),
      ),
    );
  });
});
