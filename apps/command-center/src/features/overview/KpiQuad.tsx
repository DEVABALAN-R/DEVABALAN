import { View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp } from '@/components/icons';
import { StatCard } from '@/components/ui';
import type { OverviewData } from '@/features/preview/useOverviewData';
import { useTheme } from '@/theme';

/** 2×2 KPI block; Income is the gradient hero tile (reference layout). */
export function KpiQuad({ data }: { data: OverviewData }) {
  const theme = useTheme();
  const row = { flexDirection: 'row', gap: theme.space[3], flex: 1 } as const;
  return (
    <View style={{ gap: theme.space[3], flex: 1 }}>
      <View style={row}>
        <StatCard
          style={{ flex: 1 }}
          index={1}
          variant="brand"
          label="Income"
          icon={ArrowDownLeft}
          value={data.income}
          delta={data.incomeDelta}
          caption="vs last month"
          compact
        />
        <StatCard
          style={{ flex: 1 }}
          index={2}
          label="Expenses"
          icon={ArrowUpRight}
          value={data.expense}
          delta={data.expenseDelta}
          goodWhen="down"
          caption="vs last month"
          compact
        />
      </View>
      <View style={row}>
        <StatCard
          style={{ flex: 1 }}
          index={3}
          label="Savings"
          icon={PiggyBank}
          value={data.savings}
          caption="income − expenses"
          compact
        />
        <StatCard
          style={{ flex: 1 }}
          index={4}
          label="SIP invested"
          icon={TrendingUp}
          value={data.invested}
          caption="monthly SIPs"
          compact
        />
      </View>
    </View>
  );
}
