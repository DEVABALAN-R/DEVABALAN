import { keepsUnitsCovered } from './forms';
import { replayFund } from './funds';
import { fromUnits4, toUnits4 } from './math';
import { replayStock } from './stocks';
import type { TradebookSegment, TradebookTrade } from './tradebook';
import { keepsSharesCovered } from './tradeForms';
import { amountOf, asFundTxn, asTrade } from './importRows';
import type { Fund, FundTxn, Portfolio, Stock, Trade } from './types';

/**
 * What importing a tradebook would change, holding by holding, before anything is saved:
 * the trades to add, the ones already in the app (same date, side, quantity and price),
 * the ones left out because they sell units bought before the file starts, and units or
 * shares and invested amount before and after.
 */
export type PlannedTrade = {
  date: string;
  kind: 'buy' | 'sell';
  quantity: number;
  price: number;
  /** Paise: quantity × price, as the broker shows it (stamp duty and charges are not listed). */
  amount: number;
};

export type HoldingPlan = {
  key: string;
  segment: TradebookSegment;
  isin: string;
  name: string;
  symbol: string;
  exchange: 'NSE' | 'BSE';
  /** The fund or stock already in the app, if any. */
  existingId: string | null;
  add: PlannedTrade[];
  already: number;
  leftOut: PlannedTrade[];
  /** Units (funds, 4 decimals) or shares; invested and realised in paise. */
  before: { held: number; invested: number };
  after: { held: number; invested: number; realised: number };
};

export type Additions = { funds: Fund[]; fundTxns: FundTxn[]; stocks: Stock[]; trades: Trade[] };

/** "PARAG PARIKH FLEXI CAP FUND - DIRECT PLAN" and "Parag Parikh Flexi Cap Fund - Direct Growth" match. */
export const fundNameKey = (name: string) =>
  name
    .toLowerCase()
    .split(/\b(?:direct|regular)\b/)[0]
    .replace(/[^a-z0-9]/g, '');

const titleCase = (value: string) =>
  value.toLowerCase().replace(/\b([a-z])/g, (letter) => letter.toUpperCase());

const fundKey = (t: { date: string; kind: string; units: number | null; nav: number | null }) =>
  `${t.date}|${t.kind}|${toUnits4(t.units ?? 0)}|${Math.round((t.nav ?? 0) * 10000)}`;
const stockKey = (t: {
  date: string;
  kind: string;
  quantity: number | null;
  price: number | null;
}) => `${t.date}|${t.kind}|${t.quantity ?? 0}|${t.price ?? 0}`;

/** Splits candidates into already recorded and new (as a multiset: two equal trades count twice). */
function splitKnown<T>(candidates: T[], existingKeys: string[], keyOf: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const key of existingKeys) counts.set(key, (counts.get(key) ?? 0) + 1);
  const fresh: T[] = [];
  let already = 0;
  for (const item of candidates) {
    const key = keyOf(item);
    const left = counts.get(key) ?? 0;
    if (left > 0) {
      counts.set(key, left - 1);
      already += 1;
    } else fresh.push(item);
  }
  return { fresh, already };
}

/** The fewest leading new trades to leave out so that no sale exceeds what is held. */
function firstConsistent<T>(fresh: T[], fits: (kept: T[]) => boolean): number {
  for (let skip = 0; skip <= fresh.length; skip += 1) if (fits(fresh.slice(skip))) return skip;
  return fresh.length;
}

const planned = (trade: TradebookTrade): PlannedTrade => ({
  date: trade.date,
  kind: trade.kind,
  quantity: trade.quantity,
  price: trade.price,
  amount: amountOf(trade),
});

function mainExchange(trades: TradebookTrade[]): 'NSE' | 'BSE' {
  const bse = trades.filter((trade) => trade.exchange === 'BSE').length;
  return bse > trades.length - bse ? 'BSE' : 'NSE';
}

export function planImport(trades: TradebookTrade[], portfolio: Portfolio): HoldingPlan[] {
  const groups = new Map<string, TradebookTrade[]>();
  for (const trade of trades) {
    const key = `${trade.segment}:${trade.isin}`;
    groups.set(key, [...(groups.get(key) ?? []), trade]);
  }
  const plans: HoldingPlan[] = [];
  for (const [key, group] of groups) {
    const { segment, isin } = group[0];
    const symbol = group[group.length - 1].symbol;
    if (segment === 'funds') {
      const byName = portfolio.funds.filter(
        (f) => !f.isin && fundNameKey(f.name) === fundNameKey(symbol),
      );
      const fund =
        portfolio.funds.find((f) => f.isin === isin) ??
        (byName.length === 1 ? byName[0] : undefined);
      const existing = fund ? portfolio.fundTxns.filter((t) => t.fundId === fund.id) : [];
      const known = existing.filter((t) => t.kind !== 'dividend').map(fundKey);
      const { fresh, already } = splitKnown(group, known, (t) =>
        fundKey({ ...t, units: t.quantity, nav: t.price }),
      );
      const asTxns = (list: TradebookTrade[]) => list.map((t, i) => asFundTxn(t, 'new', `n${i}`));
      const skip = firstConsistent(fresh, (kept) =>
        keepsUnitsCovered([...existing, ...asTxns(kept)]),
      );
      const before = replayFund(existing);
      const after = replayFund([...existing, ...asTxns(fresh.slice(skip))]);
      plans.push({
        key,
        segment,
        isin,
        name: fund?.name ?? titleCase(symbol),
        symbol,
        exchange: mainExchange(group),
        existingId: fund?.id ?? null,
        add: fresh.slice(skip).map(planned),
        already,
        leftOut: fresh.slice(0, skip).map(planned),
        before: { held: fromUnits4(before.units4), invested: before.invested },
        after: {
          held: fromUnits4(after.units4),
          invested: after.invested,
          realised: after.realised,
        },
      });
    } else {
      const bySymbol = portfolio.stocks.filter((s) => !s.isin && s.symbol === symbol.toUpperCase());
      const stock =
        portfolio.stocks.find((s) => s.isin === isin) ??
        (bySymbol.length === 1 ? bySymbol[0] : undefined);
      const existing = stock ? portfolio.trades.filter((t) => t.stockId === stock.id) : [];
      const known = existing.filter((t) => t.kind === 'buy' || t.kind === 'sell').map(stockKey);
      const { fresh, already } = splitKnown(group, known, (t) =>
        stockKey({ ...t, price: Math.round(t.price * 100) }),
      );
      const asTrades = (list: TradebookTrade[]) => list.map((t, i) => asTrade(t, 'new', `n${i}`));
      const skip = firstConsistent(fresh, (kept) =>
        keepsSharesCovered([...existing, ...asTrades(kept)]),
      );
      const before = replayStock(existing);
      const after = replayStock([...existing, ...asTrades(fresh.slice(skip))]);
      plans.push({
        key,
        segment,
        isin,
        name: stock?.name ?? symbol,
        symbol: stock?.symbol ?? symbol,
        exchange: stock?.exchange ?? mainExchange(group),
        existingId: stock?.id ?? null,
        add: fresh.slice(skip).map(planned),
        already,
        leftOut: fresh.slice(0, skip).map(planned),
        before: { held: before.quantity, invested: before.invested },
        after: { held: after.quantity, invested: after.invested, realised: after.realised },
      });
    }
  }
  return plans.sort(
    (a, b) => a.segment.localeCompare(b.segment) * -1 || a.name.localeCompare(b.name),
  );
}
