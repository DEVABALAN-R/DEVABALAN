import { addMonths, monthBounds } from './dates';
import { inRange } from './periods';
import type { Category, CategoryKind, DateRange, Transaction } from './types';

export const UNCATEGORIZED_ID = '__uncategorized';
export const TRANSFER_FEES_ID = '__fees';
export const OTHER_ID = '__other';

const byOrder = (a: Category, b: Category) => a.order - b.order || a.name.localeCompare(b.name);

export function topLevelCategories(categories: Category[], kind: CategoryKind): Category[] {
  return categories
    .filter((category) => category.kind === kind && category.parentId === null)
    .sort(byOrder);
}

export function subcategoriesOf(categories: Category[], parentId: string): Category[] {
  return categories.filter((category) => category.parentId === parentId).sort(byOrder);
}

/** The top-level category and (optional) subcategory for a leaf id. */
export function resolveCategory(categories: Category[], id: string | null) {
  const leaf = id ? categories.find((category) => category.id === id) : undefined;
  if (!leaf) return { parent: null, sub: null } as const;
  if (leaf.parentId === null) return { parent: leaf, sub: null } as const;
  return {
    parent: categories.find((category) => category.id === leaf.parentId) ?? null,
    sub: leaf,
  } as const;
}

/** "Food › Tea", "Rent", or null. */
export function categoryPath(categories: Category[], id: string | null): string | null {
  const { parent, sub } = resolveCategory(categories, id);
  if (!parent) return null;
  return sub ? `${parent.name} › ${sub.name}` : parent.name;
}

export type Slice = {
  id: string;
  name: string;
  amount: number;
  share: number;
  count: number;
  category: Category | null;
};

function toSlices(
  totals: Map<string, { amount: number; count: number; name: string; category: Category | null }>,
): Slice[] {
  const sum = [...totals.values()].reduce((total, item) => total + item.amount, 0);
  return [...totals.entries()]
    .map(([id, item]) => ({ id, ...item, share: sum ? item.amount / sum : 0 }))
    .filter((slice) => slice.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

/** Spending (or income) per top-level category; sums exactly to the period total. */
export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  kind: CategoryKind,
  range: DateRange,
  accountId?: string | null,
): Slice[] {
  const totals = new Map<
    string,
    { amount: number; count: number; name: string; category: Category | null }
  >();
  const add = (id: string, name: string, category: Category | null, amount: number) => {
    const current = totals.get(id) ?? { amount: 0, count: 0, name, category };
    totals.set(id, { ...current, amount: current.amount + amount, count: current.count + 1 });
  };
  for (const transaction of transactions) {
    if (!inRange(transaction, range) || (accountId && transaction.accountId !== accountId))
      continue;
    if (transaction.kind === kind) {
      const { parent } = resolveCategory(categories, transaction.categoryId);
      if (parent) add(parent.id, parent.name, parent, transaction.amount);
      else add(UNCATEGORIZED_ID, 'Uncategorized', null, transaction.amount);
    } else if (kind === 'expense' && transaction.kind === 'transfer' && transaction.fee > 0) {
      add(TRANSFER_FEES_ID, 'Transfer fees', null, transaction.fee);
    }
  }
  return toSlices(totals);
}

/**
 * Categories of one kind whose name contains `query` (case-insensitive):
 * matching top-level categories first, then matching subcategories, each in
 * their saved order. An empty query matches nothing.
 */
export function searchCategories(categories: Category[], kind: CategoryKind, query: string) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const parents = topLevelCategories(categories, kind);
  const matches = (category: Category) => category.name.toLocaleLowerCase().includes(needle);
  return [
    ...parents.filter(matches),
    ...parents.flatMap((parent) => subcategoriesOf(categories, parent.id).filter(matches)),
  ];
}

/** Keeps the largest `limit - 1` slices and folds the rest into one "Other" slice. */
export function limitSlices(slices: Slice[], limit: number): Slice[] {
  if (slices.length <= limit) return slices;
  const rest = slices.slice(limit - 1);
  const other = rest.reduce(
    (sum, slice) => ({
      amount: sum.amount + slice.amount,
      share: sum.share + slice.share,
      count: sum.count + slice.count,
    }),
    { amount: 0, share: 0, count: 0 },
  );
  return [
    ...slices.slice(0, limit - 1),
    { id: OTHER_ID, name: `Other (${rest.length})`, category: null, ...other },
  ];
}

/** Breakdown of one top-level category into its subcategories (+ "General" for parent-only entries). */
export function subcategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  parentId: string,
  range: DateRange,
  accountId?: string | null,
): Slice[] {
  const parent = categories.find((category) => category.id === parentId) ?? null;
  const totals = new Map<
    string,
    { amount: number; count: number; name: string; category: Category | null }
  >();
  for (const transaction of transactionsInCategory(
    transactions,
    categories,
    parentId,
    range,
    accountId,
  )) {
    const { sub } = resolveCategory(categories, transaction.categoryId);
    const id = sub?.id ?? parentId;
    const current = totals.get(id) ?? {
      amount: 0,
      count: 0,
      name: sub?.name ?? `${parent?.name ?? ''} (general)`,
      category: sub ?? parent,
    };
    totals.set(id, {
      ...current,
      amount: current.amount + transaction.amount,
      count: current.count + 1,
    });
  }
  return toSlices(totals);
}

/** Income/expense transactions whose leaf category belongs to `parentId`. */
export function transactionsInCategory(
  transactions: Transaction[],
  categories: Category[],
  parentId: string,
  range: DateRange,
  accountId?: string | null,
): Transaction[] {
  return transactions
    .filter((transaction) => transaction.kind !== 'transfer' && inRange(transaction, range))
    .filter((transaction) => !accountId || transaction.accountId === accountId)
    .filter(
      (transaction) => resolveCategory(categories, transaction.categoryId).parent?.id === parentId,
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

/** Monthly totals for one top-level category, oldest first. */
export function categoryTrend(
  transactions: Transaction[],
  categories: Category[],
  parentId: string,
  endMonth: string,
  months = 6,
  accountId?: string | null,
) {
  return Array.from({ length: months }, (_, index) => {
    const month = addMonths(endMonth, index - months + 1);
    const amount = transactionsInCategory(
      transactions,
      categories,
      parentId,
      monthBounds(month),
      accountId,
    ).reduce((sum, transaction) => sum + transaction.amount, 0);
    return { month, amount };
  });
}

/** Distinct recent notes used with a category (newest first) — for suggestions. */
export function recentNotes(
  transactions: Transaction[],
  categoryId: string | null,
  limit = 6,
): string[] {
  if (!categoryId) return [];
  const seen = new Set<string>();
  const notes: string[] = [];
  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  );
  for (const transaction of sorted) {
    const note = transaction.note.trim();
    const key = note.toLocaleLowerCase();
    if (transaction.categoryId !== categoryId || !note || seen.has(key)) continue;
    seen.add(key);
    notes.push(note);
    if (notes.length === limit) break;
  }
  return notes;
}
