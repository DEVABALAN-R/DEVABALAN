import { View } from 'react-native';
import { PanelScroll } from '@/components/layout/PanelScroll';
import { Card, CardHeader, CategoryIcon, Delta, Money, Text } from '@/components/ui';
import { fundTotals, sampleFunds } from '@/features/preview/sampleInvestments';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { formatMoney } from '@/lib/formatting/currency';
import { useTheme } from '@/theme';

const columns = [
  { label: 'Fund', flex: 3 },
  { label: 'Units', flex: 1, align: 'right' },
  { label: 'Avg NAV', flex: 1, align: 'right' },
  { label: 'NAV', flex: 1, align: 'right' },
  { label: 'Value', flex: 1.3, align: 'right' },
  { label: 'Gain', flex: 1.3, align: 'right' },
] as const;

export function HoldingsTable({ style }: { style?: object }) {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  return (
    <Card index={7} padding={4} style={[{ gap: theme.space[2] }, style]}>
      <View style={{ paddingHorizontal: theme.space[1] }}>
        <CardHeader
          title="Holdings"
          subtitle={`${sampleFunds.length} funds · NAV as of today (sample)`}
        />
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
          {columns.map((column) => (
            <Text
              key={column.label}
              variant="caption"
              color="textTertiary"
              uppercase
              style={{ flex: column.flex, textAlign: 'align' in column ? column.align : 'left' }}
            >
              {column.label}
            </Text>
          ))}
        </View>
      )}
      <PanelScroll gap={0}>
        {sampleFunds.map((fund) => {
          const totals = fundTotals(fund);
          const identity = (
            <View
              style={{
                flex: 3,
                minWidth: 0,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
              }}
            >
              <CategoryIcon icon={fund.icon} tint={fund.tint} size={36} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {fund.name}
                </Text>
                <Text variant="caption" color="textSecondary">
                  {fund.category}
                </Text>
              </View>
            </View>
          );
          return (
            <View
              key={fund.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                paddingVertical: theme.space[2] + 2,
                paddingHorizontal: theme.space[2],
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
              }}
            >
              {identity}
              {isMobile ? (
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  <Money value={totals.value} variant="bodyStrong" />
                  <Delta value={totals.gainPct} variant="pill" />
                </View>
              ) : (
                <>
                  <Text variant="label" numeric style={{ flex: 1, textAlign: 'right' }}>
                    {(fund.unitsMilli / 1000).toFixed(3)}
                  </Text>
                  <Text
                    variant="label"
                    color="textSecondary"
                    numeric
                    style={{ flex: 1, textAlign: 'right' }}
                  >
                    {formatMoney(fund.avgNav)}
                  </Text>
                  <Text variant="label" numeric style={{ flex: 1, textAlign: 'right' }}>
                    {formatMoney(fund.nav)}
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
            </View>
          );
        })}
      </PanelScroll>
    </Card>
  );
}
