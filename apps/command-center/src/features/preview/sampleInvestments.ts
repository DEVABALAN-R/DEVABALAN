import { Gem, Globe, Leaf, Mountain, Shield, type LucideIcon } from '@/components/icons';
import { monthShort, recentMonths, rupees, seeded } from './random';

// See ./notice.ts — design-preview sample data only. Fund names are fictional.

export type SampleFund = {
  id: string;
  name: string;
  category: string;
  icon: LucideIcon;
  tint: number;
  /** Units × 1000 (3 dp, as on statements). */
  unitsMilli: number;
  avgNav: number;
  nav: number;
  sip: number;
  sipDay: number;
};

export const sampleFunds: SampleFund[] = [
  {
    id: 'f1',
    name: 'Horizon Bluechip Fund',
    category: 'Large cap',
    icon: Mountain,
    tint: 2,
    unitsMilli: 2_412_334,
    avgNav: 6_120,
    nav: 7_384,
    sip: rupees(5_000),
    sipDay: 5,
  },
  {
    id: 'f2',
    name: 'Meridian Flexi Cap Fund',
    category: 'Flexi cap',
    icon: Globe,
    tint: 1,
    unitsMilli: 1_105_820,
    avgNav: 11_840,
    nav: 13_962,
    sip: rupees(4_000),
    sipDay: 10,
  },
  {
    id: 'f3',
    name: 'Summit Midcap Opportunities',
    category: 'Mid cap',
    icon: Gem,
    tint: 3,
    unitsMilli: 864_210,
    avgNav: 9_230,
    nav: 11_715,
    sip: rupees(3_000),
    sipDay: 15,
  },
  {
    id: 'f4',
    name: 'Orbit Nifty Index Fund',
    category: 'Index',
    icon: Leaf,
    tint: 0,
    unitsMilli: 3_020_500,
    avgNav: 2_410,
    nav: 2_766,
    sip: rupees(2_000),
    sipDay: 20,
  },
  {
    id: 'f5',
    name: 'Harbor Short Duration Debt',
    category: 'Debt',
    icon: Shield,
    tint: 6,
    unitsMilli: 1_640_000,
    avgNav: 3_150,
    nav: 3_372,
    sip: 0,
    sipDay: 0,
  },
];

/** Value and cost in paise (NAV is paise per unit). */
export function fundTotals(fund: SampleFund) {
  const invested = Math.round((fund.unitsMilli * fund.avgNav) / 1000);
  const value = Math.round((fund.unitsMilli * fund.nav) / 1000);
  return {
    invested,
    value,
    gain: value - invested,
    gainPct: invested ? ((value - invested) / invested) * 100 : 0,
  };
}

export function portfolioTotals() {
  return sampleFunds.reduce(
    (sum, fund) => {
      const totals = fundTotals(fund);
      return {
        invested: sum.invested + totals.invested,
        value: sum.value + totals.value,
        sip: sum.sip + fund.sip,
      };
    },
    { invested: 0, value: 0, sip: 0 },
  );
}

/** Indicative XIRR shown in the preview (a real one is computed in Phase 6). */
export const sampleXirr = 14.6;

/** Twelve months of portfolio value vs cumulative investment. */
export function sampleValueSeries(today = new Date()) {
  const random = seeded(77);
  const totals = portfolioTotals();
  const months = recentMonths(12, today);
  const invested = months.map((_, index) =>
    Math.round(totals.invested * (0.55 + (0.45 * (index + 1)) / months.length)),
  );
  const value = invested.map((cost, index) =>
    index === months.length - 1
      ? totals.value
      : Math.round(cost * (1 + 0.02 + (index / months.length) * 0.2 + (random() - 0.5) * 0.05)),
  );
  return { labels: months.map(monthShort), invested, value };
}

export function upcomingSips(today = new Date()) {
  return sampleFunds
    .filter((fund) => fund.sip > 0)
    .map((fund) => {
      const next = new Date(
        today.getFullYear(),
        today.getMonth() + (today.getDate() > fund.sipDay ? 1 : 0),
        fund.sipDay,
      );
      return { fund, date: next };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
