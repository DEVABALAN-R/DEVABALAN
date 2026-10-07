import { useEffect, useRef } from 'react';
import { Keyboard, View, type TextInput } from 'react-native';
import { CategoryIcon, SegmentedControl, Text, type Segment } from '@/components/ui';
import { dayLabel, MAX_NOTE_LENGTH, type TransactionKind } from '@/lib/domain/expenses';
import { useTheme } from '@/theme';
import { iconFor } from '../categoryIcons';
import { useLookup } from '../hooks/useLedger';
import { useTransactionForm } from '../state/transactionForm';
import { EntryInput } from './EntryInput';
import { FieldRow } from './FieldRow';

const kinds: readonly Segment<TransactionKind>[] = [
  { value: 'income', label: 'Income', tone: 'income' },
  { value: 'expense', label: 'Expense', tone: 'expense' },
  { value: 'transfer', label: 'Transfer', tone: 'transfer' },
];

/** The entry fields in Money Manager's order. Pressing a row opens its picker. */
export function EntryForm() {
  const theme = useTheme();
  const lookup = useLookup();
  const draft = useTransactionForm((state) => state.draft);
  const active = useTransactionForm((state) => state.active);
  const errors = useTransactionForm((state) => state.errors);
  const setKind = useTransactionForm((state) => state.setKind);
  const update = useTransactionForm((state) => state.update);
  const setActive = useTransactionForm((state) => state.setActive);
  const advance = useTransactionForm((state) => state.advance);
  const submit = useTransactionForm((state) => state.submit);
  const amountRef = useRef<TextInput>(null);
  const feeRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  const transfer = draft.kind === 'transfer';

  // Follow the flow: typing fields take focus, pickers put the keyboard away.
  useEffect(() => {
    const input = { amount: amountRef, fee: feeRef, note: noteRef }[active as 'amount'];
    if (input) input.current?.focus();
    else if (active) Keyboard.dismiss();
  }, [active]);

  const { parent, sub } = lookup.resolve(draft.categoryId);
  const leaf = sub ?? parent;
  const account = lookup.account(draft.accountId);
  const toAccount = lookup.account(draft.toAccountId);
  const placeholder = (text: string) => (
    <Text color="textTertiary" numberOfLines={1}>
      {text}
    </Text>
  );
  return (
    <View style={{ gap: theme.space[1] }}>
      <View style={{ marginBottom: theme.space[2] }}>
        <SegmentedControl
          segments={kinds}
          value={draft.kind}
          onChange={setKind}
          accessibilityLabel="Transaction type"
        />
      </View>
      <FieldRow
        label="Date"
        active={active === 'date'}
        error={errors.date}
        onPress={() => setActive('date')}
        accessibilityLabel={`Date, ${dayLabel(draft.date)}`}
      >
        <Text numberOfLines={1}>{dayLabel(draft.date, 'short')}</Text>
      </FieldRow>
      <FieldRow label="Amount" active={active === 'amount'} error={errors.amount}>
        <EntryInput
          ref={amountRef}
          money
          size="lg"
          value={draft.amountText}
          onChangeText={(amountText) => update({ amountText })}
          onFocus={() => setActive('amount')}
          onSubmitEditing={() => advance('amount')}
          returnKeyType="next"
          placeholder="0"
          accessibilityLabel="Amount in rupees"
        />
      </FieldRow>
      {transfer ? null : (
        <FieldRow
          label="Category"
          active={active === 'category'}
          error={errors.category}
          onPress={() => setActive('category')}
          accessibilityLabel={`Category, ${leaf ? lookup.path(draft.categoryId) : 'not chosen'}`}
        >
          {leaf && parent ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
              <CategoryIcon icon={iconFor(parent.icon)} tint={parent.tint} size={26} />
              <Text numberOfLines={1} style={{ flexShrink: 1 }}>
                {lookup.path(draft.categoryId)}
              </Text>
            </View>
          ) : (
            placeholder('Choose a category')
          )}
        </FieldRow>
      )}
      <FieldRow
        label={transfer ? 'From' : 'Account'}
        active={active === 'account'}
        error={errors.account}
        onPress={() => setActive('account')}
        accessibilityLabel={`${transfer ? 'From account' : 'Account'}, ${account?.name ?? 'not chosen'}`}
      >
        {account ? <Text numberOfLines={1}>{account.name}</Text> : placeholder('Choose an account')}
      </FieldRow>
      {transfer ? (
        <>
          <FieldRow
            label="To"
            active={active === 'toAccount'}
            error={errors.toAccount}
            onPress={() => setActive('toAccount')}
            accessibilityLabel={`To account, ${toAccount?.name ?? 'not chosen'}`}
          >
            {toAccount ? (
              <Text numberOfLines={1}>{toAccount.name}</Text>
            ) : (
              placeholder('Choose an account')
            )}
          </FieldRow>
          <FieldRow label="Fee" active={active === 'fee'} error={errors.fee}>
            <EntryInput
              ref={feeRef}
              money
              value={draft.feeText}
              onChangeText={(feeText) => update({ feeText })}
              onFocus={() => setActive('fee')}
              onSubmitEditing={() => advance('fee')}
              returnKeyType="next"
              placeholder="0 (optional)"
              accessibilityLabel="Transfer fee in rupees, optional"
            />
          </FieldRow>
        </>
      ) : null}
      <FieldRow label="Note" active={active === 'note'} error={errors.note}>
        <EntryInput
          ref={noteRef}
          value={draft.note}
          onChangeText={(note) => update({ note })}
          onFocus={() => setActive('note')}
          onSubmitEditing={() => submit('save')}
          returnKeyType="done"
          maxLength={MAX_NOTE_LENGTH}
          placeholder="What was it for?"
          accessibilityLabel="Note"
        />
      </FieldRow>
    </View>
  );
}
