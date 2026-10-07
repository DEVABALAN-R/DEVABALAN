import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { PanelScroll } from '@/components/layout/PanelScroll';
import { Card, CardHeader, Delta, Money, Text } from '@/components/ui';
import { sampleStocks, stockTotals } from '@/features/preview/sampleStocks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useInteractionState } from '@/hooks/useInteractionState';
import { formatMoney } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';
import { TickerBadge } from './TickerBadge';

const columns = [
  { label: 'Stock', flex: 3 },
  { label: 'Qty', flex: 0.8 },
  { label: 'Avg', flex: 1.1 },
  { label: 'LTP', flex: 1.1 },
  { label: 'Value', flex: 1.3 },
  { label: 'P&L', flex: 1.3 },
] as const;

export function StockHoldings({
  selected,
  onSelect,
  style,
}: {
  selected: string;
  onSelect: (ticker: string) => void;
  style?: object;
}) {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  return (
    <Card index={7} padding={4} style={[{ gap: theme.space[2] }, style]}>
      <View style={{ paddingHorizontal: theme.space[1] }}>
        <CardHeader title="Holdings" subtitle="Select a stock to chart it" />
      </View>
      {isMobile ? null : (
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
          {columns.map((column, index) => (
            <Text
              key={column.label}
              variant="caption"
              color="textTertiary"
              uppercase
              style={{ flex: column.flex, textAlign: index === 0 ? 'left' : 'right' }}
            >
              {column.label}
            </Text>
          ))}
        </View>
      )}
      <PanelScroll gap={0}>
        {sampleStocks.map((stock, index) => {
          const totals = stockTotals(stock);
          const active = stock.ticker === selected;
          return (
            <HoverRow
              key={stock.ticker}
              active={active}
              label={`Chart ${stock.name}`}
              onPress={() => onSelect(stock.ticker)}
            >
              <View
                style={{
                  flex: 3,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space[3],
                }}
              >
                <TickerBadge ticker={stock.ticker} tint={index + 1} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {stock.name}
                  </Text>
                  <Text variant="caption" color="textSecondary">
                    {stock.ticker} · {stock.sector}
                  </Text>
                </View>
              </View>
              {isMobile ? (
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Money value={totals.value} variant="bodyStrong" />
                  <Delta value={totals.gainPct} variant="pill" />
                </View>
              ) : (
                <>
                  <Text variant="label" numeric style={{ flex: 0.8, textAlign: 'right' }}>
                    {stock.quantity}
                  </Text>
                  <Text
                    variant="label"
                    color="textSecondary"
                    numeric
                    style={{ flex: 1.1, textAlign: 'right' }}
                  >
                    {formatMoney(stock.avgPrice)}
                  </Text>
                  <Text variant="label" numeric style={{ flex: 1.1, textAlign: 'right' }}>
                    {formatMoney(stock.price)}
                  </Text>
                  <Money
                    value={totals.value}
                    variant="label"
                    style={{ flex: 1.3, textAlign: 'right' }}
                  />
                  <View style={{ flex: 1.3, alignItems: 'flex-end' }}>
                    <Money value={totals.gain} tone="auto" variant="label" />
                    <Text variant="caption" color={totals.gain >= 0 ? 'profit' : 'loss'} numeric>
                      {totals.gainPct >= 0 ? '▲' : '▼'} {Math.abs(totals.gainPct).toFixed(1)}%
                    </Text>
                  </View>
                </>
              )}
            </HoverRow>
          );
        })}
      </PanelScroll>
    </Card>
  );
}

function HoverRow({
  active,
  label,
  onPress,
  children,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  return (
    <Pressable
      role="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      {...handlers}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          paddingVertical: theme.space[2] + 2,
          paddingHorizontal: theme.space[2],
          borderRadius: theme.radius.md,
          backgroundColor: active
            ? theme.colors.accentSoft
            : hovered
              ? theme.colors.surfaceMuted
              : 'transparent',
        },
        focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
      ]}
    >
      {children}
    </Pressable>
  );
}
