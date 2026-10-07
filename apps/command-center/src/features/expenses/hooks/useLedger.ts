import { useMemo } from 'react';
import {
  categoryPath,
  resolveCategory,
  type Account,
  type Category,
  type Person,
} from '@/lib/domain/expenses';
import { useExpenseStore } from '../state/expenseStore';

/** Current ledger arrays from the preview store. */
export function useLedger() {
  const accounts = useExpenseStore((state) => state.accounts);
  const categories = useExpenseStore((state) => state.categories);
  const transactions = useExpenseStore((state) => state.transactions);
  const people = useExpenseStore((state) => state.people);
  return { accounts, categories, transactions, people };
}

/** Id lookups shared by rows, pickers and panels. */
export function buildLookup(accounts: Account[], categories: Category[], people: Person[] = []) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const personById = new Map(people.map((person) => [person.id, person]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  return {
    account: (id: string | null | undefined) => (id ? accountById.get(id) : undefined),
    category: (id: string | null | undefined) => (id ? categoryById.get(id) : undefined),
    path: (id: string | null) => categoryPath(categories, id),
    resolve: (id: string | null) => resolveCategory(categories, id),
    person: (id: string | null | undefined) => (id ? personById.get(id) : undefined),
  };
}

export type Lookup = ReturnType<typeof buildLookup>;

export function useLookup(): Lookup {
  const { accounts, categories, people } = useLedger();
  return useMemo(() => buildLookup(accounts, categories, people), [accounts, categories, people]);
}
