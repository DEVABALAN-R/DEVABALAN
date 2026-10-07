import { View } from 'react-native';
import { PanelScroll } from '@/components/layout/PanelScroll';
import { Card, CardHeader, Text } from '@/components/ui';
import { sectorAllocation } from '@/features/preview/sampleStocks';
import { useTween } from '@/hooks/useTween';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

/** Sector weights as colourful horizontal bars. */
export function SectorCard({ style }: { style?: object }) {
  const theme = useTheme();
  const sectors = sectorAllocation();
  const total = sectors.reduce((sum, item) => sum + item.value, 0);
  const progress = useTween(sectors.length, 900);
  return (
    <Card index={6} style={[{ gap: theme.space[3] }, style]}>
      <CardHeader
        title="Sectors"
        subtitle={`${sectors.length} sectors · ${formatMoneyWhole(total)}`}
      />
      <PanelScroll gap={theme.space[3]}>
        {sectors.map((item, index) => {
          const share = total ? item.value / total : 0;
          return (
            <View
              key={item.sector}
              accessible
              accessibilityLabel={`${item.sector}: ${Math.round(share * 100)} percent`}
              style={{ gap: 6 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="label">{item.sector}</Text>
                <Text variant="label" color="textSecondary" numeric>
                  {Math.round(share * 100)}%
                </Text>
              </View>
              <View
                style={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: theme.colors.surfaceMuted,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${share * 100 * progress}%`,
                    height: '100%',
                    borderRadius: 5,
                    backgroundColor: theme.colors.chart[index % theme.colors.chart.length],
                  }}
                />
              </View>
            </View>
          );
        })}
      </PanelScroll>
    </Card>
  );
}
