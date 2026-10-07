import { View } from 'react-native';
import { Card, Delta, Money, ProgressBar, Text } from '@/components/ui';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

type SpendSummaryCardProps = { spent: number; income: number; budget: number; delta: number };

/** Gradient hero: spent this month against the budget, with days remaining. */
export function SpendSummaryCard({ spent, income, budget, delta }: SpendSummaryCardProps) {
  const theme = useTheme();
  const today = new Date();
  const daysLeft =
    new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
  const left = budget - spent;
  return (
    <Card variant="brand" index={0} style={{ gap: theme.space[3] }}>
      <Text color="onBrand">Spent this month</Text>
      <Money
        value={spent}
        animate
        variant="figure"
        color="onBrand"
        numberOfLines={1}
        adjustsFontSizeToFit
      />
      <Delta value={delta} goodWhen="down" variant="onBrand" comparison="vs last month" />
      <View style={{ gap: theme.space[2], marginTop: theme.space[1] }}>
        <ProgressBar
          value={budget ? spent / budget : 0}
          hatched
          tone="primary"
          height={12}
          accessibilityLabel="Monthly budget used"
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="caption" color="onBrandMuted" numeric>
            {left >= 0 ? `${formatMoneyWhole(left)} left` : `${formatMoneyWhole(-left)} over`}
          </Text>
          <Text variant="caption" color="onBrandMuted">
            {daysLeft} days to go
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingTop: theme.space[2],
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.18)',
        }}
      >
        <Text variant="label" color="onBrandMuted">
          Income
        </Text>
        <Money value={income} variant="label" color="onBrand" />
      </View>
    </Card>
  );
}
