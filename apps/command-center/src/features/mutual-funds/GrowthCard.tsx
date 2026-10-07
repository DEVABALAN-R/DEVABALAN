import { useState } from 'react';
import { TrendLineChart } from '@/components/charts';
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
        subtitle="Value (line) vs amount invested (dashed)"
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
      <TrendLineChart
        points={labels.map((label, index) => ({ label, value: value[index], name: label }))}
        compare={{ name: 'Invested', values: invested }}
        formatValue={formatAxisMoney}
        accessibilityLabel={`Portfolio value grew from ${formatMoneyWhole(value[0])} to ${formatMoneyWhole(value[value.length - 1])} over ${range === '6M' ? 'six months' : 'one year'}, against ${formatMoneyWhole(invested[invested.length - 1])} invested.`}
      />
    </Card>
  );
}
