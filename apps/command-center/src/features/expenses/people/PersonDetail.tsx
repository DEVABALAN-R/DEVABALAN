import { Pressable, View } from 'react-native';
import { HandCoins, Pencil, Trash2 } from '@/components/icons';
import { Badge, Button, Money, Text } from '@/components/ui';
import { useInteractionState } from '@/hooks/useInteractionState';
import { dayLabel, type OpenSplit, type PersonBalance } from '@/lib/domain/expenses';
import { useTheme } from '@/theme';
import { formatEntry } from '../format';
import { useLookup } from '../hooks/useLedger';
import { useTransactionForm } from '../state/transactionForm';

type PersonDetailProps = {
  balance: PersonBalance;
  onSettle: () => void;
  onRename: () => void;
  onDelete: () => void;
};

/** One person: what they owe, each shared expense and its status, and their repayments. */
export function PersonDetail({ balance, onSettle, onRename, onDelete }: PersonDetailProps) {
  const theme = useTheme();
  const lookup = useLookup();
  const openEdit = useTransactionForm((state) => state.openEdit);
  const { person, outstanding, lent, repaid } = balance;
  return (
    <View style={{ gap: theme.space[4] }}>
      <View style={{ gap: theme.space[1] }}>
        <Text variant="label" color="textSecondary">
          {outstanding >= 0 ? `${person.name} owes you` : `You owe ${person.name}`}
        </Text>
        <Money
          value={Math.abs(outstanding)}
          variant="figure"
          tone={outstanding > 0 ? 'income' : 'neutral'}
        />
        <Text variant="caption" color="textTertiary">
          {`Shared ${formatEntry(lent)} · paid back ${formatEntry(repaid)}`}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] }}>
        <Button
          label="Mark as paid"
          icon={HandCoins}
          disabled={outstanding <= 0}
          onPress={onSettle}
        />
        <Button label="Rename" icon={Pencil} variant="secondary" onPress={onRename} />
        <Button label="Delete" icon={Trash2} variant="ghost" onPress={onDelete} />
      </View>
      <Text variant="eyebrow" color="textTertiary" uppercase>
        {`Shared expenses · ${balance.splits.length}`}
      </Text>
      {balance.splits.length ? (
        balance.splits.map((split) => (
          <ShareRow
            key={split.transaction.id}
            split={split}
            title={split.transaction.note || lookup.path(split.transaction.categoryId) || 'Expense'}
            onPress={() => openEdit(split.transaction)}
          />
        ))
      ) : (
        <Text color="textSecondary">
          Nothing shared yet. Use Split when adding an expense you paid for them.
        </Text>
      )}
      {balance.repayments.length ? (
        <>
          <Text variant="eyebrow" color="textTertiary" uppercase>
            {`Paid back · ${balance.repayments.length}`}
          </Text>
          {balance.repayments.map((repayment) => (
            <Pressable
              key={repayment.id}
              role="button"
              accessibilityLabel={`Repayment ${formatEntry(repayment.amount)} on ${dayLabel(repayment.date)}, edit`}
              onPress={() => openEdit(repayment)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                paddingVertical: 6,
              }}
            >
              <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                {`${dayLabel(repayment.date, 'short')} · ${lookup.account(repayment.accountId)?.name ?? 'Account'}`}
              </Text>
              <Text variant="label" color="income" numeric>
                {formatEntry(repayment.amount, 'always')}
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
}

function ShareRow({
  split,
  title,
  onPress,
}: {
  split: OpenSplit;
  title: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { hovered, handlers } = useInteractionState();
  const status =
    split.remaining === 0
      ? { label: 'Paid', tone: 'success' as const }
      : split.paid > 0
        ? { label: `${formatEntry(split.remaining)} left`, tone: 'warning' as const }
        : { label: 'Unpaid', tone: 'neutral' as const };
  return (
    <Pressable
      role="button"
      accessibilityLabel={`${title}, ${dayLabel(split.transaction.date)}, their share ${formatEntry(split.amount)}, ${status.label}`}
      onPress={onPress}
      {...handlers}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        padding: theme.space[2],
        borderRadius: theme.radius.md,
        backgroundColor: hovered ? theme.colors.surfaceMuted : 'transparent',
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textTertiary" numberOfLines={1}>
          {`${dayLabel(split.transaction.date, 'short')} · bill ${formatEntry(split.transaction.amount)}`}
        </Text>
      </View>
      <Text variant="label" numeric>
        {formatEntry(split.amount)}
      </Text>
      <Badge label={status.label} tone={status.tone} />
    </Pressable>
  );
}
