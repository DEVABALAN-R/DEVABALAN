import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DonutChart } from '@/components/charts';
import { Card, CardHeader, CategoryIcon, Money, ProgressBar, Text } from '@/components/ui';
import { sampleCategories, type SampleTransaction } from '@/features/preview/sampleExpenses';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

/** Where the money went: donut + legend rows with per-category budget bars. */
export function CategoryBreakdown({
  transactions,
  style,
}: {
  transactions: SampleTransaction[];
  style?: object;
}) {
  const theme = useTheme();
  const [active, setActive] = useState<string | null>(null);
  // Colour follows the category (its fixed index), never its rank.
  const rows = sampleCategories
    .map((category, index) => ({
      category,
      color: theme.colors.chart[index % theme.colors.chart.length],
      spent: transactions
        .filter((row) => row.kind === 'expense' && row.categoryId === category.id)
        .reduce((sum, row) => sum + row.amount, 0),
    }))
    .filter((row) => row.spent > 0)
    .sort((a, b) => b.spent - a.spent);
  const total = rows.reduce((sum, row) => sum + row.spent, 0);
  const top = rows[0];
  return (
    <Card index={4} style={[{ gap: theme.space[3] }, style]}>
      <CardHeader
        title="By category"
        subtitle={top ? `${top.category.name} is your largest category` : 'No spending yet'}
      />
      <View style={{ alignItems: 'center' }}>
        <DonutChart
          size={164}
          activeLabel={active}
          segments={rows.map((row) => ({
            label: row.category.name,
            value: row.spent,
            color: row.color,
          }))}
          accessibilityLabel={`Spending by category, total ${formatMoneyWhole(total)}. ${rows
            .slice(0, 3)
            .map((row) => `${row.category.name} ${Math.round((row.spent / total) * 100)} percent`)
            .join(', ')}.`}
        >
          <Text variant="caption" color="textSecondary">
            Total spent
          </Text>
          <Money value={total} variant="title" />
        </DonutChart>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: theme.space[1] }}
        nestedScrollEnabled
      >
        {rows.map((row) => (
          <View
            key={row.category.id}
            onPointerEnter={() => setActive(row.category.name)}
            onPointerLeave={() => setActive(null)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[3],
              padding: theme.space[2],
              borderRadius: theme.radius.md,
              backgroundColor:
                active === row.category.name ? theme.colors.surfaceMuted : 'transparent',
            }}
          >
            <CategoryIcon icon={row.category.icon} tint={row.category.tint} size={32} />
            <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View
                  style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }}
                />
                <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                  {row.category.name}
                </Text>
                <Text variant="label" numeric>
                  {formatMoneyWhole(row.spent)}
                </Text>
              </View>
              <ProgressBar
                value={row.spent / row.category.budget}
                height={5}
                tone={row.spent > row.category.budget ? 'danger' : 'ink'}
                accessibilityLabel={`${row.category.name} budget used`}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Card>
  );
}
