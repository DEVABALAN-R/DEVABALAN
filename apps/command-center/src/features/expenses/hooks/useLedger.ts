import { useMemo } from 'react';
import { categoryPath, resolveCategory, type Account, type Category } from '@/lib/domain/expenses';
import { useExpenseStore } from '../state/expenseStore';

/** Current ledger arrays from the preview store. */
export function useLedger() {
  const accounts = useExpenseStore((state) => state.accounts);
  const categories = useExpenseStore((state) => state.categories);
  const transactions = useExpenseStore((state) => state.transactions);
  return { accounts, categories, transactions };
}

/** Id lookups shared by rows, pickers and panels. */
export function buildLookup(accounts: Account[], categories: Category[]) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  return {
    account: (id: string | null | undefined) => (id ? accountById.get(id) : undefined),
    category: (id: string | null | undefined) => (id ? categoryById.get(id) : undefined),
    path: (id: string | null) => categoryPath(categories, id),
    resolve: (id: string | null) => resolveCategory(categories, id),
  };
}

export type Lookup = ReturnType<typeof buildLookup>;

export function useLookup(): Lookup {
  const { accounts, categories } = useLedger();
  return useMemo(() => buildLookup(accounts, categories), [accounts, categories]);
}
