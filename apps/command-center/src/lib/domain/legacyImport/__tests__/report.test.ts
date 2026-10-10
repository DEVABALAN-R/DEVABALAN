import {
  accountGap,
  addedTotal,
  categoryGap,
  emptyReport,
  fundMatches,
  reportIssues,
  skippedTotal,
  summaryLine,
  type AccountCheck,
  type FundCheck,
  type ImportReport,
} from '..';

const account = (patch: Partial<AccountCheck>): AccountCheck => ({
  name: 'Bank',
  legacyName: 'Bank',
  group: 'bank',
  reused: false,
  legacy: 0,
  current: 0,
  transfers: 0,
  skipped: 0,
  ...patch,
});

const fund = (patch: Partial<FundCheck>): FundCheck => ({
  name: 'Fund',
  reused: false,
  legacyInvested: 100000,
  currentInvested: 100000,
  legacyUnits: 10.1234,
  currentUnits: 10.1234,
  skipped: 0,
  ...patch,
});

const report = (patch: Partial<ImportReport> = {}): ImportReport => ({
  ...emptyReport('preview'),
  ...patch,
});

describe('accountGap', () => {
  it('is zero once card payments and left-out entries are accounted for', () => {
    // Bank: the old app ignored a ₹1,200 card bill paid from it; a ₹100 entry had a bad date.
    expect(
      accountGap(
        account({ legacy: 5933965, current: 5823965, transfers: -120000, skipped: -10000 }),
      ),
    ).toBe(0);
    // Card: a ₹20 refund the old app ignored.
    expect(accountGap(account({ legacy: -250000, current: -248000, transfers: 2000 }))).toBe(0);
  });

  it('shows the opening-balance difference of an account that was already here', () => {
    expect(accountGap(account({ reused: true, legacy: 42500, current: -7500 }))).toBe(-50000);
  });
});

describe('funds and categories', () => {
  it('compares units to 4 decimals', () => {
    expect(fundMatches(fund({ currentUnits: 10.12340001 }))).toBe(true);
    expect(fundMatches(fund({ currentUnits: 10.1235 }))).toBe(false);
    expect(fundMatches(fund({ currentInvested: 99999 }))).toBe(false);
  });

  it('category gap is what was left out', () => {
    expect(categoryGap({ kind: 'expense', name: 'Food', legacy: 171575, current: 156575 })).toBe(
      15000,
    );
  });

  it('lists only unexplained lines; funds with left-out purchases are explained', () => {
    const issues = reportIssues(
      report({
        accounts: [account({}), account({ legacy: 1, current: 2 })],
        categories: [{ kind: 'income', name: 'Salary', legacy: 5, current: 5 }],
        funds: [fund({}), fund({ currentInvested: 1, skipped: 1 }), fund({ currentInvested: 1 })],
      }),
    );
    expect(issues.accounts).toHaveLength(1);
    expect(issues.categories).toHaveLength(0);
    expect(issues.funds).toHaveLength(1);
  });
});

describe('summary', () => {
  const counts = {
    accounts: { legacy: 4, added: 2, reused: 1, skipped: 1 },
    categories: { legacy: 0, added: 4, reused: 1, skipped: 0, subcategoriesAdded: 5 },
    transactions: { legacy: 13, added: 1, reused: 0, skipped: 4 },
    funds: { legacy: 3, added: 0, reused: 2, skipped: 1 },
    purchases: { legacy: 5, added: 3, reused: 0, skipped: 2 },
  };

  it('counts what is added and what is left out', () => {
    expect(addedTotal(report({ counts }))).toBe(15);
    expect(
      skippedTotal(report({ skipped: [{ area: 'transactions', reason: 'x', count: 4 }] })),
    ).toBe(4);
  });

  it('says what an import adds, or added', () => {
    expect(summaryLine(report({ counts }))).toBe('Adds 1 entry, 2 accounts, 3 fund purchases.');
    expect(summaryLine(report({ counts, status: 'imported' }))).toMatch(/^Added 1 entry/);
    expect(summaryLine(report())).toBe('Everything from the old app is already here.');
  });
});
