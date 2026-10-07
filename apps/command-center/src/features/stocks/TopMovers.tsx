import { View } from 'react-native';
import { PanelScroll } from '@/components/layout/PanelScroll';
import { Sparkline } from '@/components/charts';
import { Card, CardHeader, Delta, Text } from '@/components/ui';
import { sampleStocks, stockTotals } from '@/features/preview/sampleStocks';
import { useTheme } from '@/theme';
import { TickerBadge } from './TickerBadge';

export function TopMovers({ style }: { style?: object }) {
  const theme = useTheme();
  const movers = sampleStocks
    .map((stock, index) => ({ stock, index, change: stockTotals(stock).dayChangePct }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  return (
    <Card index={8} padding={4} style={[{ gap: theme.space[2] }, style]}>
      <View style={{ paddingHorizontal: theme.space[1] }}>
        <CardHeader title="Today’s movers" subtitle="Largest moves first" />
      </View>
      <PanelScroll gap={theme.space[2]}>
        {movers.map(({ stock, index, change }) => (
          <View
            key={stock.ticker}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[3],
              padding: theme.space[2],
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.surfaceMuted,
            }}
          >
            <TickerBadge ticker={stock.ticker} tint={index + 1} size={34} />
            <View style={{ width: 64 }}>
              <Text variant="label">{stock.ticker}</Text>
              <Delta value={change} />
            </View>
            <View style={{ flex: 1 }}>
              <Sparkline
                values={stock.history.slice(-15)}
                color={change >= 0 ? theme.colors.brandFrom : theme.colors.expense}
                height={30}
                filled={false}
              />
            </View>
          </View>
        ))}
      </PanelScroll>
    </Card>
  );
}
