export const STORAGE = {
  transactions: 'spendwise.transactions.v1',
  categories: 'spendwise.categories.v1',
  categorySetup: 'spendwise.categories.setup.v1',
  accounts: 'devabalan.accounts.v1',
} as const;

export function readLegacyArray(key: string): unknown[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function hasCategorySetup(): boolean {
  return localStorage.getItem(STORAGE.categorySetup) === '1';
}

export function clearLegacyFinanceStorage(): void {
  Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
}
