import { useState } from 'react';
import { CalendarDays, ChartPie, Percent, PiggyBank, Plus, TrendingUp } from '@/components/icons';
import { BentoCell, BentoRow } from '@/components/layout/Bento';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen, useFitMode } from '@/components/layout/Screen';
import { StatStrip } from '@/components/layout/StatStrip';
import { Button, StatCard } from '@/components/ui';
import { SampleDataBadge } from '@/features/preview/SampleDataBadge';
import { PlannedSheet } from '@/features/shell/PlaceholderSheets';
import {
  fundTotals,
  portfolioTotals,
  sampleFunds,
  sampleXirr,
} from '@/features/preview/sampleInvestments';
import { AllocationCard } from './AllocationCard';
import { GrowthCard } from './GrowthCard';
import { HoldingsTable } from './HoldingsTable';
import { UpcomingSips } from './UpcomingSips';

/** Mutual fund tracker: one screen on desktop (panels scroll internally). */
export function MutualFundsScreen() {
  const fit = useFitMode(true);
  const [recording, setRecording] = useState(false);
  const totals = portfolioTotals();
  const gain = totals.value - totals.invested;
  const gainPct = totals.invested ? (gain / totals.invested) * 100 : 0;
  const categories = new Map<string, number>();
  sampleFunds.forEach((fund) =>
    categories.set(fund.category, (categories.get(fund.category) ?? 0) + fundTotals(fund).value),
  );
  const allocation = [...categories.entries()].map(([label, value], index) => ({
    label,
    value,
    colorIndex: index,
  }));
  return (
    <Screen fit>
      <PageHeader
        size="compact"
        title="Mutual funds"
        meta={<SampleDataBadge />}
        actions={<Button label="Record purchase" icon={Plus} onPress={() => setRecording(true)} />}
      />
      <StatStrip
        hero={
          <StatCard
            variant="brand"
            label="Current value"
            icon={ChartPie}
            value={totals.value}
            delta={gainPct}
            caption="total return"
            index={0}
            style={{ flex: 1 }}
          />
        }
      >
        <StatCard
          compact
          label="Invested"
          icon={PiggyBank}
          value={totals.invested}
          caption="across 5 funds"
          index={1}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="Total gain"
          icon={TrendingUp}
          value={gain}
          delta={gainPct}
          caption="unrealised"
          index={2}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="XIRR"
          icon={Percent}
          value={`${sampleXirr.toFixed(1)}%`}
          caption="annualised (indicative)"
          index={3}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="Monthly SIP"
          icon={CalendarDays}
          value={totals.sip}
          caption="4 active SIPs"
          index={4}
          style={{ flex: 1 }}
        />
      </StatStrip>
      <BentoRow stackBelow="desktop" fill={fit ? 1 : undefined}>
        <BentoCell flex={8}>
          <GrowthCard style={fit ? { flex: 1 } : { height: 300 }} />
        </BentoCell>
        <BentoCell flex={4}>
          <AllocationCard
            title="Allocation"
            subtitle="By fund category"
            items={allocation}
            style={fit ? { flex: 1 } : { height: 260 }}
          />
        </BentoCell>
      </BentoRow>
      <BentoRow stackBelow="desktop" fill={fit ? 1.15 : undefined}>
        <BentoCell flex={8}>
          <HoldingsTable style={fit ? { flex: 1 } : { height: 400 }} />
        </BentoCell>
        <BentoCell flex={4}>
          <UpcomingSips style={fit ? { flex: 1 } : { height: 360 }} />
        </BentoCell>
      </BentoRow>
      <PlannedSheet
        visible={recording}
        onClose={() => setRecording(false)}
        title="Record purchase"
        description="Log a lump sum or SIP instalment with units and NAV."
        icon={ChartPie}
        phase="Phase 6"
        body="Fund holdings arrive with the investments phase. A SIP can already be recorded as a transfer to your investment account in Expenses."
      />
    </Screen>
  );
}
