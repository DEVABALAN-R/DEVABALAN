import { useState } from 'react';
import {
  ArrowLeftRight,
  ChartCandlestick,
  Layers,
  PiggyBank,
  Plus,
  TrendingUp,
} from '@/components/icons';
import { BentoCell, BentoRow } from '@/components/layout/Bento';
import { PageHeader } from '@/components/layout/PageHeader';
import { Screen, useFitMode } from '@/components/layout/Screen';
import { StatStrip } from '@/components/layout/StatStrip';
import { Button, StatCard } from '@/components/ui';
import { SampleDataBadge } from '@/features/preview/SampleDataBadge';
import { sampleStocks, stockPortfolio } from '@/features/preview/sampleStocks';
import { useUiStore } from '@/state/ui';
import { PriceChartCard } from './PriceChartCard';
import { SectorCard } from './SectorCard';
import { StockHoldings } from './StockHoldings';
import { TopMovers } from './TopMovers';

/** Stock portfolio: one screen on desktop (panels scroll internally). */
export function StocksScreen() {
  const fit = useFitMode(true);
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  const [ticker, setTicker] = useState(sampleStocks[0].ticker);
  const selected = sampleStocks.find((stock) => stock.ticker === ticker) ?? sampleStocks[0];
  const totals = stockPortfolio();
  const gain = totals.value - totals.invested;
  const gainPct = totals.invested ? (gain / totals.invested) * 100 : 0;
  const dayPct =
    totals.value - totals.dayChange
      ? (totals.dayChange / (totals.value - totals.dayChange)) * 100
      : 0;
  return (
    <Screen fit>
      <PageHeader
        size="compact"
        title="Stocks"
        meta={<SampleDataBadge />}
        actions={<Button label="Add trade" icon={Plus} onPress={openQuickAdd} />}
      />
      <StatStrip
        hero={
          <StatCard
            variant="brand"
            label="Portfolio value"
            icon={ChartCandlestick}
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
          caption="cost basis"
          index={1}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="Total P&L"
          icon={TrendingUp}
          value={gain}
          delta={gainPct}
          caption="unrealised"
          index={2}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="Day change"
          icon={ArrowLeftRight}
          value={totals.dayChange}
          delta={dayPct}
          caption="today"
          index={3}
          style={{ flex: 1 }}
        />
        <StatCard
          compact
          label="Holdings"
          icon={Layers}
          value={`${sampleStocks.length} stocks`}
          caption="6 sectors"
          index={4}
          style={{ flex: 1 }}
        />
      </StatStrip>
      <BentoRow stackBelow="desktop" fill={fit ? 1.1 : undefined}>
        <BentoCell flex={8}>
          <PriceChartCard
            selected={selected}
            onSelect={setTicker}
            style={fit ? { flex: 1 } : { height: 380 }}
          />
        </BentoCell>
        <BentoCell flex={4}>
          <SectorCard style={fit ? { flex: 1 } : { height: 300 }} />
        </BentoCell>
      </BentoRow>
      <BentoRow stackBelow="desktop" fill={fit ? 1 : undefined}>
        <BentoCell flex={8}>
          <StockHoldings
            selected={ticker}
            onSelect={setTicker}
            style={fit ? { flex: 1 } : { height: 420 }}
          />
        </BentoCell>
        <BentoCell flex={4}>
          <TopMovers style={fit ? { flex: 1 } : { height: 380 }} />
        </BentoCell>
      </BentoRow>
    </Screen>
  );
}
