import { View } from 'react-native';
import { Wallet } from '@/components/icons';
import { CategoryIcon, Money, Text } from '@/components/ui';
import type { SampleTransaction } from '@/features/preview/sampleExpenses';
import { useInteractionState } from '@/hooks/useInteractionState';
import { useTheme } from '@/theme';
import { describe, shortDate } from './lookup';

type TransactionRowProps = {
  row: SampleTransaction;
  /** `table` = columns (desktop); `compact` = two-line list row (phones, side panels). */
  layout: 'table' | 'compact';
  showDate?: boolean;
};

export function TransactionRow({ row, layout, showDate = true }: TransactionRowProps) {
  const theme = useTheme();
  const { hovered, handlers } = useInteractionState();
  const { category, account } = describe(row);
  const income = row.kind === 'income';
  const amount = (
    <Money
      value={income ? row.amount : -row.amount}
      tone={income ? 'income' : 'neutral'}
      signDisplay="always"
      variant="bodyStrong"
      style={{ textAlign: 'right' }}
    />
  );
  const identity = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        flex: layout === 'table' ? 3 : 1,
        minWidth: 0,
      }}
    >
      <CategoryIcon
        icon={category?.icon ?? Wallet}
        tint={category?.tint ?? 0}
        size={layout === 'table' ? 38 : 36}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {row.title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {layout === 'compact'
            ? [category?.name, showDate ? shortDate(row.date) : account?.name]
                .filter(Boolean)
                .join(' · ')
            : category?.name}
        </Text>
      </View>
    </View>
  );

  // Hover highlight only: rows open a detail view once transactions are real (Phase 5).
  return (
    <View
      onPointerEnter={handlers.onHoverIn}
      onPointerLeave={handlers.onHoverOut}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space[3],
        paddingVertical: theme.space[2] + 2,
        paddingHorizontal: theme.space[2],
        borderRadius: theme.radius.md,
        backgroundColor: hovered ? theme.colors.surfaceMuted : 'transparent',
      }}
    >
      {identity}
      {layout === 'table' ? (
        <>
          <Text variant="label" color="textSecondary" style={{ flex: 1.4 }} numberOfLines={1}>
            {account?.name}
          </Text>
          <Text variant="label" color="textSecondary" style={{ flex: 1 }} numberOfLines={1}>
            {shortDate(row.date)}
          </Text>
          <View style={{ flex: 1.2 }}>{amount}</View>
        </>
      ) : (
        amount
      )}
    </View>
  );
}

/** Column headings for the `table` layout. */
export function TransactionTableHeader() {
  const theme = useTheme();
  const head = (label: string, flex: number, align: 'left' | 'right' = 'left') => (
    <Text variant="caption" color="textTertiary" style={{ flex, textAlign: align }} uppercase>
      {label}
    </Text>
  );
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space[3],
        paddingHorizontal: theme.space[2],
        paddingVertical: theme.space[2],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      {head('Activity', 3)}
      {head('Account', 1.4)}
      {head('Date', 1)}
      {head('Amount', 1.2, 'right')}
    </View>
  );
}
