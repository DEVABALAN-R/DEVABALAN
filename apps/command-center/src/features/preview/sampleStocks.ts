import { rupees, seeded } from './random';

// See ./notice.ts — design-preview sample data only. Companies and tickers are fictional.

export type SampleStock = {
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  /** Paise per share. */
  avgPrice: number;
  price: number;
  /** Price history (paise), oldest → newest, 60 trading days. */
  history: number[];
};

function history(seed: number, end: number, drift: number): number[] {
  const random = seeded(seed);
  const points: number[] = [];
  let price = end / (1 + drift);
  for (let day = 0; day < 60; day += 1) {
    price *= 1 + drift / 60 + (random() - 0.5) * 0.035;
    points.push(Math.round(price));
  }
  const scale = end / points[points.length - 1];
  return points.map((point) => Math.round(point * scale));
}

const make = (
  ticker: string,
  name: string,
  sector: string,
  quantity: number,
  avg: number,
  price: number,
  seed: number,
  drift: number,
): SampleStock => ({
  ticker,
  name,
  sector,
  quantity,
  avgPrice: rupees(avg),
  price: rupees(price),
  history: history(seed, rupees(price), drift),
});

export const sampleStocks: SampleStock[] = [
  make('AURA', 'Aurora Technologies', 'Technology', 40, 1_480, 1_712, 11, 0.12),
  make('BNYN', 'Banyan Bank', 'Financials', 85, 642, 698, 22, 0.06),
  make('CDRP', 'Cedar Pharma', 'Healthcare', 30, 1_120, 1_034, 33, -0.07),
  make('DLTP', 'Delta Power Grid', 'Utilities', 120, 286, 331, 44, 0.1),
  make('EMBR', 'Ember Motors', 'Automobile', 25, 2_340, 2_615, 55, 0.09),
  make('FRNT', 'Frontier Foods', 'Consumer', 60, 512, 489, 66, -0.03),
];

export function stockTotals(stock: SampleStock) {
  const invested = stock.avgPrice * stock.quantity;
  const value = stock.price * stock.quantity;
  const previous = stock.history[stock.history.length - 2] ?? stock.price;
  return {
    invested,
    value,
    gain: value - invested,
    gainPct: invested ? ((value - invested) / invested) * 100 : 0,
    dayChangePct: previous ? ((stock.price - previous) / previous) * 100 : 0,
    dayChange: (stock.price - previous) * stock.quantity,
  };
}

export function stockPortfolio() {
  return sampleStocks.reduce(
    (sum, stock) => {
      const totals = stockTotals(stock);
      return {
        invested: sum.invested + totals.invested,
        value: sum.value + totals.value,
        dayChange: sum.dayChange + totals.dayChange,
      };
    },
    { invested: 0, value: 0, dayChange: 0 },
  );
}

export function sectorAllocation() {
  const bySector = new Map<string, number>();
  for (const stock of sampleStocks) {
    bySector.set(stock.sector, (bySector.get(stock.sector) ?? 0) + stockTotals(stock).value);
  }
  return [...bySector.entries()]
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value);
}

/** Labels for the last `count` weekdays ending today, e.g. "7 Oct". */
export function tradingDayLabels(count: number, today = new Date()): string[] {
  const format = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
  const labels: string[] = [];
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (labels.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) labels.unshift(format.format(cursor));
    cursor.setDate(cursor.getDate() - 1);
  }
  return labels;
}
