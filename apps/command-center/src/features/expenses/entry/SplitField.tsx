import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { UserPlus, X } from '@/components/icons';
import { Button, Text } from '@/components/ui';
import { amountToInput, equalShares, parseAmount, type SplitDraft } from '@/lib/domain/expenses';
import { useTheme } from '@/theme';
import { TextField } from '../components/TextField';
import { formatEntry } from '../format';
import { useLookup } from '../hooks/useLedger';
import { useExpenseStore } from '../state/expenseStore';
import { savePerson } from '../state/peopleActions';
import { useTransactionForm } from '../state/transactionForm';
import { EntryInput } from './EntryInput';
import { FieldRow } from './FieldRow';
import { PickChip } from './PickChip';

/** "Split" line of the entry form (expenses): who shares it and your own share. */
export function SplitRow() {
  const lookup = useLookup();
  const draft = useTransactionForm((state) => state.draft);
  const active = useTransactionForm((state) => state.active);
  const error = useTransactionForm((state) => state.errors.split);
  const setActive = useTransactionForm((state) => state.setActive);
  const names = draft.splits.map((split) => lookup.person(split.personId)?.name ?? 'Someone');
  const summary = names.length ? `With ${names.join(', ')}` : 'Not split';
  return (
    <FieldRow
      label="Split"
      active={active === 'split'}
      error={error}
      onPress={() => setActive('split')}
      accessibilityLabel={`Split, ${summary}`}
    >
      <Text numberOfLines={1} color={names.length ? 'textPrimary' : 'textTertiary'}>
        {summary}
      </Text>
    </FieldRow>
  );
}

/** "From" line shown instead of the category when editing a repayment. */
export function RepaymentRow() {
  const lookup = useLookup();
  const personId = useTransactionForm((state) => state.draft.personId);
  const name = lookup.person(personId)?.name ?? 'Someone';
  return (
    <FieldRow label="From" active={false} accessibilityLabel={`Repayment from ${name}`}>
      <Text numberOfLines={1}>{`${name} paid you back`}</Text>
    </FieldRow>
  );
}

/** Picker for the Split field: people chips, each person's share, and equal splitting. */
export function SplitPanel() {
  const theme = useTheme();
  const people = useExpenseStore((state) => state.people);
  const draft = useTransactionForm((state) => state.draft);
  const update = useTransactionForm((state) => state.update);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const amount = parseAmount(draft.amountText) ?? 0;
  const setSplits = (splits: SplitDraft[]) => update({ splits });
  const toggle = (personId: string) =>
    setSplits(
      draft.splits.some((split) => split.personId === personId)
        ? draft.splits.filter((split) => split.personId !== personId)
        : [...draft.splits, { personId, amountText: '' }],
    );
  const equal = (includeMe: boolean) => {
    const shares = equalShares(amount, draft.splits.length, includeMe);
    setSplits(
      draft.splits.map((split, index) => ({ ...split, amountText: amountToInput(shares[index]) })),
    );
  };
  const addPerson = () => {
    const result = savePerson(name);
    if (typeof result === 'string') return setNameError(result);
    setSplits([...draft.splits, { personId: result.id, amountText: '' }]);
    setName('');
    setNameError(null);
    setAdding(false);
  };
  const others = draft.splits.reduce((sum, split) => sum + (parseAmount(split.amountText) ?? 0), 0);
  return (
    <View style={{ gap: theme.space[3] }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
        {people.map((person) => (
          <PickChip
            key={person.id}
            label={person.name}
            selected={draft.splits.some((split) => split.personId === person.id)}
            onPress={() => toggle(person.id)}
            accessibilityLabel={`Split with ${person.name}`}
          />
        ))}
        <Pressable
          role="button"
          accessibilityLabel="Add a person"
          onPress={() => setAdding((value) => !value)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10 }}
        >
          <UserPlus size={16} color={theme.colors.textSecondary} />
          <Text variant="label" color="textSecondary">
            Person
          </Text>
        </Pressable>
      </View>
      {adding ? (
        <View style={{ gap: theme.space[2] }}>
          <TextField
            label="New person's name"
            value={name}
            onChangeText={setName}
            error={nameError}
            maxLength={30}
            autoFocus
            onSubmitEditing={addPerson}
          />
          <Button label="Add and split" size="sm" onPress={addPerson} />
        </View>
      ) : null}
      {draft.splits.map((split) => {
        const person = people.find((item) => item.id === split.personId);
        return (
          <View
            key={split.personId}
            style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}
          >
            <Text variant="label" style={{ width: 84 }} numberOfLines={1}>
              {person?.name ?? 'Someone'}
            </Text>
            <View style={{ flex: 1 }}>
              <EntryInput
                money
                value={split.amountText}
                placeholder="0"
                accessibilityLabel={`${person?.name ?? 'Their'} share in rupees`}
                onChangeText={(amountText) =>
                  setSplits(
                    draft.splits.map((item) =>
                      item.personId === split.personId ? { ...item, amountText } : item,
                    ),
                  )
                }
              />
            </View>
            <Pressable
              role="button"
              accessibilityLabel={`Remove ${person?.name ?? 'person'} from the split`}
              onPress={() => toggle(split.personId)}
              hitSlop={8}
            >
              <X size={16} color={theme.colors.textTertiary} />
            </Pressable>
          </View>
        );
      })}
      {draft.splits.length ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
            <Button
              label="Equally, with me"
              size="sm"
              variant="secondary"
              onPress={() => equal(true)}
            />
            <Button
              label="They pay all"
              size="sm"
              variant="secondary"
              onPress={() => equal(false)}
            />
          </View>
          <Text variant="label" color={others > amount ? 'danger' : 'textSecondary'}>
            {others > amount
              ? 'Shares add up to more than the expense.'
              : `Your share ${formatEntry(amount - others)} · they owe you ${formatEntry(others)}`}
          </Text>
        </>
      ) : (
        <Text color="textSecondary">
          Paid for friends? Choose who shares this expense. Stats and budgets count only your share,
          and People tracks what each person owes you.
        </Text>
      )}
    </View>
  );
}
