/**
 * Expense-manager domain model. Mirrors the planned Supabase tables
 * (docs/architecture/MODERNIZATION_PLAN.md §7) so the preview store can be
 * replaced by repositories without touching calculations or UI.
 * All money is integer paise; dates are local calendar dates (YYYY-MM-DD).
 */

export type CategoryKind = 'expense' | 'income';

export type Category = {
  id: string;
  kind: CategoryKind;
  /** null = top-level category; otherwise the parent's id (one level deep). */
  parentId: string | null;
  name: string;
  /** Icon key resolved by the UI layer (keeps the domain free of UI imports). */
  icon: string;
  /** Index into the theme's category tints. */
  tint: number;
  /** Monthly budget in paise (top-level expense categories only). */
  budget: number | null;
  order: number;
};

export type AccountGroup = 'cash' | 'bank' | 'card' | 'wallet' | 'investment' | 'loan';

export type Account = {
  id: string;
  name: string;
  group: AccountGroup;
  /** Signed paise: negative means money owed (cards, loans). */
  openingBalance: number;
  order: number;
};

export type TransactionKind = 'expense' | 'income' | 'transfer';

export type Transaction = {
  id: string;
  kind: TransactionKind;
  date: string;
  /** Always > 0; direction comes from `kind`. */
  amount: number;
  /** Income: credited account. Expense: paying account. Transfer: source. */
  accountId: string;
  /** Transfer destination; null otherwise. */
  toAccountId: string | null;
  /** Transfer fee charged to the source account (counts as an expense). */
  fee: number;
  /** Leaf category (subcategory or top-level); null for transfers/uncategorised. */
  categoryId: string | null;
  note: string;
  createdAt: number;
};

export type DateRange = { start: string; end: string };

export const ACCOUNT_GROUP_LABELS: Record<AccountGroup, string> = {
  cash: 'Cash',
  bank: 'Bank accounts',
  card: 'Cards',
  wallet: 'Wallets',
  investment: 'Savings & investments',
  loan: 'Loans',
};

export const ACCOUNT_GROUP_ORDER: AccountGroup[] = [
  'cash',
  'bank',
  'card',
  'wallet',
  'investment',
  'loan',
];
