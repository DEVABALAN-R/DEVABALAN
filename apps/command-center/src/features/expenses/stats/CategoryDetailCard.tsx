import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { BarChart } from '@/components/charts';
import { ReceiptText } from '@/components/icons';
import { EmptyState } from '@/components/feedback';
import { Card, CardHeader, CategoryIcon, Text } from '@/components/ui';
import { useFitMode } from '@/components/layout/Screen';
import { monthLabel, monthOf, todayIso } from '@/lib/domain/expenses';
import { formatAxisMoney, formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';
import { iconFor } from '../categoryIcons';
import { LedgerRow } from '../components/LedgerRow';
import { PanelScroll } from '../components/PanelScroll';
import { SliceRow } from '../components/SliceRow';
import { useSliceColors } from '../sliceColors';
import { useExpenseUi } from '../state/expenseUi';
import type { StatsView } from './useStatsView';

type CategoryDetailCardProps = {
  view: StatsView;
  active: string | null;
  onHover: (label: string | null) => void;
  style?: StyleProp<ViewStyle>;
};

/** One category: its trend, its subcategories and its entries in the period. */
export function CategoryDetailCard({ view, active, onHover, style }: CategoryDetailCardProps) {
  const theme = useTheme();
  const fit = useFitMode(true);
  const accountId = useExpenseUi((state) => state.accountId);
  const colors = useSliceColors(view.subSlices);
  const category = view.drill;
  if (!category) return null;
  const trendLabel = view.period === 'year' ? 'Each month of the year' : 'Last 6 months';
  return (
    <Card index={2} style={[{ gap: theme.space[3] }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
        <CategoryIcon icon={iconFor(category.icon)} tint={category.tint} size={40} />
        <View style={{ flex: 1 }}>
          <CardHeader title={category.name} subtitle={trendLabel} />
        </View>
      </View>
      <BarChart
        height={fit ? 130 : 160}
        data={view.trend.map((point) => ({
          label: monthLabel(point.month, 'short'),
          values: [point.amount],
          projected: point.month === monthOf(todayIso()),
        }))}
        series={[{ name: category.name, color: theme.colors.chartNegative }]}
        formatValue={formatMoneyWhole}
        formatAxis={formatAxisMoney}
        accessibilityLabel={`${category.name} by month: ${view.trend
          .map((point) => `${monthLabel(point.month, 'short')} ${formatMoneyWhole(point.amount)}`)
          .join(', ')}.`}
      />
      {view.entries.length ? (
        <PanelScroll>
          {view.subSlices.length > 1 ? (
            <>
              <Text variant="eyebrow" color="textTertiary" uppercase style={{ marginTop: 4 }}>
                Subcategories
              </Text>
              {view.subSlices.map((slice, index) => (
                <SliceRow
                  key={slice.id}
                  slice={slice}
                  color={colors[index]}
                  active={active === slice.name}
                  onHover={onHover}
                />
              ))}
            </>
          ) : null}
          <Text variant="eyebrow" color="textTertiary" uppercase style={{ marginTop: 8 }}>
            Entries · {view.entries.length}
          </Text>
          {view.entries.map((transaction) => (
            <LedgerRow
              key={transaction.id}
              transaction={transaction}
              accountId={accountId}
              showDate
            />
          ))}
        </PanelScroll>
      ) : (
        <EmptyState
          icon={ReceiptText}
          title="No entries in this period"
          body={`Nothing was recorded under ${category.name} in ${view.periodLabel}.`}
        />
      )}
    </Card>
  );
}
