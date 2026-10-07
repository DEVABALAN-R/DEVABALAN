import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { TrendLineChart } from '@/components/charts';
import { Card, Delta, Money, SegmentedControl, Text } from '@/components/ui';
import {
  sampleStocks,
  stockTotals,
  tradingDayLabels,
  type SampleStock,
} from '@/features/preview/sampleStocks';
import { formatMoney, formatMoneyWhole } from '@/lib/formatting/currency';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useTheme } from '@/theme';
import { TickerBadge } from './TickerBadge';

type Range = '1M' | '3M';

export function PriceChartCard({
  selected,
  onSelect,
  style,
}: {
  selected: SampleStock;
  onSelect: (ticker: string) => void;
  style?: object;
}) {
  const theme = useTheme();
  const [range, setRange] = useState<Range>('3M');
  const { isDense } = useBreakpoint();
  const totals = stockTotals(selected);
  const history = range === '1M' ? selected.history.slice(-22) : selected.history;
  const up = history[history.length - 1] >= history[0];
  const index = sampleStocks.indexOf(selected);
  return (
    <Card index={5} style={[{ gap: theme.space[3] }, style]}>
      {/* Dense windows drop the chip row; rows in Holdings still select a stock. */}
      {isDense ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.space[2] }}
          style={{ flexGrow: 0, height: 36, minHeight: 36 }}
        >
          {sampleStocks.map((stock) => {
            const active = stock.ticker === selected.ticker;
            const change = stockTotals(stock).dayChangePct;
            return (
              <Pressable
                key={stock.ticker}
                role="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${stock.name}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)} percent today`}
                onPress={() => onSelect(stock.ticker)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  height: 34,
                  paddingHorizontal: theme.space[3],
                  borderRadius: theme.radius.pill,
                  backgroundColor: active ? theme.colors.ink : theme.colors.surfaceMuted,
                }}
              >
                <Text variant="label" color={active ? 'onInk' : 'textPrimary'}>
                  {stock.ticker}
                </Text>
                <Text
                  variant="caption"
                  style={{
                    color: active
                      ? theme.colors.onInkMuted
                      : change >= 0
                        ? theme.colors.profit
                        : theme.colors.loss,
                  }}
                >
                  {change >= 0 ? '▲' : '▼'}
                  {Math.abs(change).toFixed(1)}%
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3] }}>
        <TickerBadge ticker={selected.ticker} tint={index + 1} size={isDense ? 32 : 44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant={isDense ? 'bodyStrong' : 'title'} numberOfLines={1}>
            {selected.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[2] }}>
            <Money value={selected.price} variant="bodyStrong" />
            <Delta value={totals.dayChangePct} variant="pill" comparison="today" />
          </View>
        </View>
        <SegmentedControl
          size="sm"
          fill={false}
          accessibilityLabel="Range"
          value={range}
          onChange={setRange}
          segments={[
            { value: '1M', label: '1M' },
            { value: '3M', label: '3M' },
          ]}
        />
      </View>
      <TrendLineChart
        points={tradingDayLabels(selected.history.length)
          .slice(-history.length)
          .map((label, index) => ({ label, value: history[index], name: label }))}
        color={up ? undefined : theme.colors.expense}
        formatValue={formatMoneyWhole}
        accessibilityLabel={`${selected.name} price over ${range === '1M' ? 'one month' : 'three months'}: from ${formatMoney(history[0])} to ${formatMoney(history[history.length - 1])}.`}
      />
    </Card>
  );
}
