/**
 * The check report of the one-time import from the old app (migration 0008). Built by the
 * database from the rows it wrote, so what it shows is what an import does. Money is in
 * paise; balances use the new sign (negative = owed) and count entries up to `asOf`.
 */
export type ImportStatus = 'none' | 'preview' | 'imported' | 'error';

/** Rows in the old app, rows this run adds, rows already in the app, rows left out. */
export type AreaCount = { legacy: number; added: number; reused: number; skipped: number };

export type AccountCheck = {
  /** The account's name in the app now (it may have been renamed since). */
  name: string;
  legacyName: string;
  group: string;
  /** It was already in the app (same name), so its own opening balance is kept. */
  reused: boolean;
  /** The old app's balance, worked out by the old app's rules. */
  legacy: number;
  /** The balance in the app from the imported entries. */
  current: number;
  /** Card payments and transfers the old app left out of this account's balance. */
  transfers: number;
  /** The old app's effect of entries that were not imported. */
  skipped: number;
};

export type CategoryCheck = {
  kind: 'income' | 'expense';
  name: string;
  legacy: number;
  current: number;
};

export type FundCheck = {
  name: string;
  reused: boolean;
  legacyInvested: number;
  currentInvested: number;
  legacyUnits: number;
  currentUnits: number;
  /** Purchases that were not imported. */
  skipped: number;
};

export type SkippedGroup = { area: string; reason: string; count: number };

export type ImportReport = {
  status: ImportStatus;
  /** Only for `error`: what the database said. */
  message: string;
  asOf: string | null;
  /** When an earlier import was run (or this one, after importing). */
  importedAt: string | null;
  counts: {
    accounts: AreaCount;
    categories: AreaCount & { subcategoriesAdded: number };
    transactions: AreaCount;
    funds: AreaCount;
    purchases: AreaCount;
  };
  skipped: SkippedGroup[];
  accounts: AccountCheck[];
  categories: CategoryCheck[];
  funds: FundCheck[];
};

const ZERO: AreaCount = { legacy: 0, added: 0, reused: 0, skipped: 0 };

export const emptyReport = (status: ImportStatus, message = ''): ImportReport => ({
  status,
  message,
  asOf: null,
  importedAt: null,
  counts: {
    accounts: ZERO,
    categories: { ...ZERO, subcategoriesAdded: 0 },
    transactions: ZERO,
    funds: ZERO,
    purchases: ZERO,
  },
  skipped: [],
  accounts: [],
  categories: [],
  funds: [],
});

/**
 * What the known reasons do not explain: zero when the balances agree once card payments
 * (now transfers) and entries left out are accounted for. For an account that was already
 * in the app it is the difference between the two opening balances.
 */
export const accountGap = (account: AccountCheck) =>
  account.current - account.legacy - account.transfers + account.skipped;

/** Amount in the old app's entries of this category that were not imported. */
export const categoryGap = (category: CategoryCheck) => category.legacy - category.current;

/** Units are compared to 4 decimals, as stored. */
const sameUnits = (a: number, b: number) => Math.round(a * 10000) === Math.round(b * 10000);

export const fundMatches = (fund: FundCheck) =>
  fund.legacyInvested === fund.currentInvested && sameUnits(fund.legacyUnits, fund.currentUnits);

/** Rows this run adds (or added). */
export function addedTotal(report: ImportReport): number {
  const { accounts, categories, transactions, funds, purchases } = report.counts;
  return (
    accounts.added +
    categories.added +
    categories.subcategoriesAdded +
    transactions.added +
    funds.added +
    purchases.added
  );
}

export const skippedTotal = (report: ImportReport) =>
  report.skipped.reduce((sum, group) => sum + group.count, 0);

/** Lines worth a look: balances, categories or funds that differ for no stated reason. */
export function reportIssues(report: ImportReport) {
  return {
    accounts: report.accounts.filter((account) => accountGap(account) !== 0),
    categories: report.categories.filter((category) => categoryGap(category) !== 0),
    funds: report.funds.filter((fund) => fund.skipped === 0 && !fundMatches(fund)),
  };
}

const plural = (count: number, one: string, many = `${one}s`) =>
  `${count.toLocaleString('en-IN')} ${count === 1 ? one : many}`;

/** One line for the card: what an import adds. */
export function summaryLine(report: ImportReport): string {
  const { accounts, transactions, funds, purchases } = report.counts;
  const parts = [
    transactions.added && plural(transactions.added, 'entry', 'entries'),
    accounts.added && plural(accounts.added, 'account'),
    funds.added && plural(funds.added, 'fund'),
    purchases.added && plural(purchases.added, 'fund purchase'),
  ].filter(Boolean);
  if (!parts.length) return 'Everything from the old app is already here.';
  const verb = report.status === 'imported' ? 'Added' : 'Adds';
  return `${verb} ${parts.join(', ')}.`;
}
