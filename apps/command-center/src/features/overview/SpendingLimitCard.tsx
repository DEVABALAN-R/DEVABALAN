import { View } from 'react-native';
import { Card, CardHeader, CategoryIcon, Money, ProgressBar, Text } from '@/components/ui';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { sampleCategories } from '@/features/preview/sampleExpenses';
import { useTheme } from '@/theme';

type SpendingLimitCardProps = {
  spent: number;
  budget: number;
  top: [string, number][];
  index?: number;
};

export function SpendingLimitCard({ spent, budget, top, index = 6 }: SpendingLimitCardProps) {
  const theme = useTheme();
  const used = budget ? spent / budget : 0;
  return (
    <Card index={index} style={{ gap: theme.space[4] }}>
      <CardHeader title="Monthly spending limit" subtitle={`${Math.round(used * 100)}% used`} />
      <View style={{ gap: theme.space[2] }}>
        <ProgressBar
          value={used}
          hatched
          height={14}
          tone={used > 0.9 ? 'danger' : 'brandFrom'}
          accessibilityLabel="Monthly budget used"
        />
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
        >
          <Text variant="label" color="textSecondary">
            <Money value={spent} variant="bodyStrong" /> spent
          </Text>
          <Text variant="label" color="textSecondary" numeric>
            of {formatMoneyWhole(budget)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
        {top.map(([id, amount]) => {
          const category = sampleCategories.find((item) => item.id === id);
          if (!category) return null;
          return (
            <View
              key={id}
              style={{
                flex: 1,
                minWidth: 0,
                gap: 6,
                padding: theme.space[3],
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surfaceMuted,
              }}
            >
              <CategoryIcon icon={category.icon} tint={category.tint} size={28} />
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {category.name}
              </Text>
              <Text variant="label" numeric numberOfLines={1}>
                {formatMoneyWhole(amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
