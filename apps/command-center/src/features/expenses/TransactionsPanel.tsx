import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Card, CardHeader, SegmentedControl, Text } from '@/components/ui';
import type { SampleTransaction } from '@/features/preview/sampleExpenses';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';
import { dayHeading } from './lookup';
import { TransactionRow } from './TransactionRow';

type Filter = 'all' | 'expense' | 'income';

/** Day-grouped transactions; scrolls inside its card so the page itself does not. */
export function TransactionsPanel({
  transactions,
  style,
}: {
  transactions: SampleTransaction[];
  style?: object;
}) {
  const theme = useTheme();
  const [filter, setFilter] = useState<Filter>('all');
  const groups = useMemo(() => {
    const visible = transactions.filter((row) => filter === 'all' || row.kind === filter);
    const byDay = new Map<string, SampleTransaction[]>();
    for (const row of visible) byDay.set(row.date, [...(byDay.get(row.date) ?? []), row]);
    return [...byDay.entries()];
  }, [transactions, filter]);
  return (
    <Card index={3} padding={4} style={[{ gap: theme.space[2], minHeight: 280 }, style]}>
      <View style={{ paddingHorizontal: theme.space[1], gap: theme.space[3] }}>
        <CardHeader
          title="Transactions"
          subtitle={`${transactions.length} this month`}
          action={
            <SegmentedControl
              size="sm"
              fill={false}
              accessibilityLabel="Show"
              value={filter}
              onChange={setFilter}
              segments={[
                { value: 'all', label: 'All' },
                { value: 'expense', label: 'Spent', tone: 'expense' },
                { value: 'income', label: 'Income', tone: 'income' },
              ]}
            />
          }
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.space[1] }}
        nestedScrollEnabled
      >
        {groups.map(([date, rows]) => {
          const net = rows.reduce(
            (sum, row) => sum + (row.kind === 'income' ? row.amount : -row.amount),
            0,
          );
          return (
            <View key={date}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingHorizontal: theme.space[2],
                  paddingTop: theme.space[2],
                }}
              >
                <Text variant="caption" color="textTertiary" uppercase>
                  {dayHeading(date)}
                </Text>
                <Text variant="caption" color="textTertiary" numeric>
                  {formatMoneyWhole(net, 'always')}
                </Text>
              </View>
              {rows.map((row) => (
                <TransactionRow key={row.id} row={row} layout="compact" showDate={false} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </Card>
  );
}
