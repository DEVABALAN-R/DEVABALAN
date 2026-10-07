import { AreaChart } from '@/components/charts';
import { Card, CardHeader } from '@/components/ui';
import { formatAxisMoney, formatMoneyWhole } from '@/lib/formatting/currency';
import type { SampleTransaction } from '@/features/preview/sampleExpenses';
import { isoDate } from '@/features/preview/random';
import { useTheme } from '@/theme';

/** Daily spending this month against the even daily budget pace. */
export function DailySpendCard({
  transactions,
  budget,
  style,
}: {
  transactions: SampleTransaction[];
  budget: number;
  style?: object;
}) {
  const theme = useTheme();
  const today = new Date();
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const values = Array.from({ length: today.getDate() }, (_, index) => {
    const key = isoDate(new Date(today.getFullYear(), today.getMonth(), index + 1));
    return transactions
      .filter((row) => row.kind === 'expense' && row.date === key)
      .reduce((sum, row) => sum + row.amount, 0);
  });
  const pace = Math.round(budget / days);
  const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  return (
    <Card index={2} style={[{ gap: theme.space[2] }, style]}>
      <CardHeader
        title="Daily spending"
        subtitle={`Average ${formatMoneyWhole(average)} a day · budget pace ${formatMoneyWhole(pace)}`}
      />
      <AreaChart
        labels={values.map((_, index) => String(index + 1))}
        values={values}
        seriesName="Spent"
        color={theme.colors.chart[1]}
        compare={{ name: 'Budget pace', values: values.map(() => pace) }}
        formatValue={(value) => formatMoneyWhole(value)}
        formatAxis={formatAxisMoney}
        accessibilityLabel={`Daily spending this month. Average ${formatMoneyWhole(average)} a day against a budget pace of ${formatMoneyWhole(pace)}.`}
      />
    </Card>
  );
}
