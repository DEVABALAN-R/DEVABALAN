import { useState } from 'react';
import { AreaChart } from '@/components/charts';
import { Card, CardHeader, SegmentedControl } from '@/components/ui';
import { sampleValueSeries } from '@/features/preview/sampleInvestments';
import { formatAxisMoney, formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

type Range = '6M' | '1Y';

/** Portfolio value against the amount invested over time. */
export function GrowthCard({ style }: { style?: object }) {
  const theme = useTheme();
  const [range, setRange] = useState<Range>('1Y');
  const series = sampleValueSeries();
  const take = range === '6M' ? 6 : 12;
  const labels = series.labels.slice(-take);
  const value = series.value.slice(-take);
  const invested = series.invested.slice(-take);
  return (
    <Card index={5} style={[{ gap: theme.space[2] }, style]}>
      <CardHeader
        title="Growth"
        subtitle="Portfolio value vs amount invested"
        action={
          <SegmentedControl
            size="sm"
            fill={false}
            accessibilityLabel="Range"
            value={range}
            onChange={setRange}
            segments={[
              { value: '6M', label: '6M' },
              { value: '1Y', label: '1Y' },
            ]}
          />
        }
      />
      <AreaChart
        labels={labels}
        values={value}
        seriesName="Value"
        color={theme.colors.brandFrom}
        compare={{ name: 'Invested', values: invested }}
        formatValue={(amount) => formatMoneyWhole(amount)}
        formatAxis={formatAxisMoney}
        accessibilityLabel={`Portfolio value grew from ${formatMoneyWhole(value[0])} to ${formatMoneyWhole(value[value.length - 1])} over ${range === '6M' ? 'six months' : 'one year'}, against ${formatMoneyWhole(invested[invested.length - 1])} invested.`}
      />
    </Card>
  );
}
