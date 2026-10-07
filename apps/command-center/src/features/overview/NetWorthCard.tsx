import { View } from 'react-native';
import { ArrowLeftRight, Plus } from '@/components/icons';
import { Button, Card, CategoryIcon, Delta, Money, Text, Tile } from '@/components/ui';
import { sampleAccounts } from '@/features/preview/sampleExpenses';
import type { OverviewData } from '@/features/preview/useOverviewData';
import { formatMoneyWhole } from '@/lib/formatting/currency';
import { useUiStore } from '@/state/ui';
import { useTheme } from '@/theme';

export function NetWorthCard({ data }: { data: OverviewData }) {
  const theme = useTheme();
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  return (
    <Card index={0} style={{ gap: theme.space[4], flex: 1 }}>
      <View style={{ gap: theme.space[1] }}>
        <Text color="textSecondary">Net worth</Text>
        <Money
          value={data.netWorth}
          animate
          variant="figure"
          style={{ fontSize: 36, lineHeight: 42 }}
          numberOfLines={1}
          adjustsFontSizeToFit
        />
        <Delta value={data.netWorthDelta} variant="pill" comparison="than last month" />
      </View>
      <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
        <View style={{ flex: 1 }}>
          <Button label="Add expense" icon={Plus} fullWidth onPress={openQuickAdd} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label="Transfer"
            icon={ArrowLeftRight}
            variant="secondary"
            fullWidth
            onPress={openQuickAdd}
          />
        </View>
      </View>
      <Tile style={{ gap: theme.space[3] }}>
        <Text variant="label" color="textSecondary">
          Accounts · {sampleAccounts.length}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.space[2] }}>
          {sampleAccounts.slice(0, 3).map((account) => (
            <View
              key={account.id}
              style={{
                flex: 1,
                minWidth: 0,
                gap: theme.space[2],
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
              }}
            >
              <CategoryIcon icon={account.icon} tint={account.tint} size={30} />
              <Text variant="bodyStrong" numeric numberOfLines={1}>
                {formatMoneyWhole(account.balance)}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {account.name}
              </Text>
            </View>
          ))}
        </View>
      </Tile>
    </Card>
  );
}
