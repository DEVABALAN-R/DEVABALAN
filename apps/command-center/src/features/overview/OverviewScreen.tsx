import { View } from 'react-native';
import { CalendarDays } from '@/components/icons';
import { BentoCell, BentoRow } from '@/components/layout/Bento';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen } from '@/components/layout/Screen';
import { Text } from '@/components/ui';
import { previewProfile } from '@/features/preview/notice';
import { SampleDataBadge } from '@/features/preview/SampleDataBadge';
import { useOverviewData } from '@/features/preview/useOverviewData';
import { greeting } from '@/lib/formatting/greeting';
import { useTheme } from '@/theme';
import { CashflowCard } from './CashflowCard';
import { InvestmentsSnapshot } from './InvestmentsSnapshot';
import { KpiQuad } from './KpiQuad';
import { NetWorthCard } from './NetWorthCard';
import { RecentActivityCard } from './RecentActivityCard';
import { SpendingLimitCard } from './SpendingLimitCard';

/** The command center home: net worth, cash flow, spending and investments. */
export function OverviewScreen() {
  const theme = useTheme();
  const data = useOverviewData();
  const today = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  return (
    <Screen>
      <PageHeader
        size="hero"
        title={`${greeting()}, ${previewProfile.name}`}
        description="Your money at a glance: balances, cash flow, spending and investments."
        meta={<SampleDataBadge />}
        actions={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 44,
              paddingHorizontal: theme.space[4],
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.surface,
            }}
          >
            <CalendarDays size={16} color={theme.colors.textSecondary} />
            <Text variant="label">{today}</Text>
          </View>
        }
      />
      <BentoRow stackBelow="desktop">
        <BentoCell flex={4}>
          <NetWorthCard data={data} />
        </BentoCell>
        <BentoCell flex={4}>
          <KpiQuad data={data} />
        </BentoCell>
        <BentoCell flex={4}>
          <CashflowCard flow={data.flow} height={250} />
        </BentoCell>
      </BentoRow>
      <BentoRow stackBelow="desktop">
        <BentoCell flex={4}>
          <SpendingLimitCard spent={data.expense} budget={data.budget} top={data.topCategories} />
          <InvestmentsSnapshot data={data} />
        </BentoCell>
        <BentoCell flex={8}>
          <RecentActivityCard transactions={data.transactions} />
        </BentoCell>
      </BentoRow>
    </Screen>
  );
}
