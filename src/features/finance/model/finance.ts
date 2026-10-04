import type { Account, Category, Transaction } from './types';

export const COLORS = ['#3568f5', '#ff7043', '#f5b82e', '#a855f7', '#12b8a6', '#ef4f9b', '#70b82d', '#22a6d5'] as const;

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
export const compactMoney = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });
export const formatMoney = (amount: number): string => money.format(Number(amount) || 0);
export const dateKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const monthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
export const monthDate = (key: string): Date => { const [year, month] = key.split('-').map(Number); return new Date(year, month - 1, 1); };
export const monthLabel = (key: string, year = false): string => new Intl.DateTimeFormat('en-IN', { month: 'short', ...(year ? { year: '2-digit' } : {}) }).format(monthDate(key));

export function monthTransactions(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((item) => item.date.slice(0, 7) === month);
}

export function openingBankBalance(accounts: Account[], transactions: Transaction[], month: string): number {
  const opening = accounts.filter((account) => account.type === 'bank').reduce((sum, account) => sum + account.openingBalance, 0);
  return transactions.filter((item) => item.date < `${month}-01`).reduce((balance, item) => {
    const account = accounts.find((entry) => entry.id === item.accountId);
    if (account?.type === 'bank' && item.type === 'income') return balance + item.amount;
    if (account?.type === 'bank' && item.type === 'expense') return balance - item.amount;
    if (item.type === 'payment' && accounts.some((entry) => entry.id === item.toAccountId && entry.type === 'credit')) return balance;
    return balance;
  }, opening);
}

export function accountBalance(account: Account, transactions: Transaction[], cutoff = dateKey(new Date())): number {
  return transactions.filter((item) => item.date <= cutoff).reduce((balance, item) => {
    if (account.type === 'bank') {
      if (item.accountId === account.id && item.type === 'income') return balance + item.amount;
      if (item.accountId === account.id && item.type === 'expense') return balance - item.amount;
    } else {
      if (item.accountId === account.id && item.type === 'expense') return balance + item.amount;
      if (item.type === 'payment' && item.toAccountId === account.id) return balance - item.amount;
    }
    return balance;
  }, account.openingBalance);
}

export type MonthlyTotals = {
  income: number;
  expense: number;
  categories: Record<string, number>;
  subcategories: Record<string, number>;
};

export function calculateMonthlyTotals(transactions: Transaction[], months: string[]): Record<string, MonthlyTotals> {
  const result: Record<string, MonthlyTotals> = Object.fromEntries(months.map((month) => [month, { income: 0, expense: 0, categories: {}, subcategories: {} }]));
  transactions.forEach((item) => {
    if (!['income', 'expense'].includes(item.type) || !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return;
    const row = result[item.date.slice(0, 7)];
    if (!row || !Number.isFinite(item.amount) || item.amount <= 0) return;
    if (item.type === 'income') row.income += item.amount;
    else {
      row.expense += item.amount;
      const category = item.category || 'Uncategorized';
      row.categories[category] = (row.categories[category] || 0) + item.amount;
      if (item.subcategory) {
        const key = `${category}::${item.subcategory}`;
        row.subcategories[key] = (row.subcategories[key] || 0) + item.amount;
      }
    }
  });
  return result;
}

export function monthCategoryTotals(transactions: Transaction[], month: string, type: Category['type']): Record<string, number> {
  return transactions.filter((item) => item.date.slice(0, 7) === month && item.type === type)
    .reduce<Record<string, number>>((totals, item) => {
      const category = item.category || 'Uncategorized';
      totals[category] = (totals[category] || 0) + item.amount;
      return totals;
    }, {});
}
