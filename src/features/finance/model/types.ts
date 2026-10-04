export type TransactionType = 'expense' | 'income' | 'payment';

export type Account = {
  id: string;
  name: string;
  type: 'bank' | 'credit';
  openingBalance: number;
};

export type Category = {
  id?: string;
  name: string;
  type: Exclude<TransactionType, 'payment'>;
  subcategories: string[];
  icon?: string;
  color?: string;
  monthlyBudget?: number;
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  accountId: string;
  toAccountId?: string;
  category?: string;
  subcategory?: string;
  date: string;
  note?: string;
  created: number;
};

export function normalizeTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Transaction>;
  const amount = Number(item.amount);
  const transactionDate = typeof item.date === 'string' ? item.date : '';
  const date = new Date(`${transactionDate}T12:00:00`);
  if (typeof item.id !== 'string' || !item.id || typeof item.description !== 'string'
    || !Number.isFinite(amount) || amount <= 0
    || !['income', 'expense', 'payment'].includes(String(item.type))
    || typeof item.accountId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)
    || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== transactionDate) return null;
  return {
    id: item.id,
    description: item.description.trim(),
    amount,
    type: item.type as TransactionType,
    accountId: item.accountId,
    ...(typeof item.toAccountId === 'string' ? { toAccountId: item.toAccountId } : {}),
    ...(typeof item.category === 'string' ? { category: item.category } : {}),
    ...(typeof item.subcategory === 'string' ? { subcategory: item.subcategory } : {}),
    date: transactionDate,
    ...(typeof item.note === 'string' ? { note: item.note } : {}),
    created: Number.isFinite(Number(item.created)) ? Number(item.created) : 0,
  };
}

export function normalizeAccount(value: unknown): Account | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Account>;
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name.trim()) return null;
  return {
    id: item.id,
    name: item.name.trim(),
    type: item.type === 'credit' ? 'credit' : 'bank',
    openingBalance: Number.isFinite(Number(item.openingBalance)) ? Number(item.openingBalance) : 0,
  };
}

export function normalizeCategory(value: unknown): Category | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Category>;
  if (typeof item.name !== 'string' || !item.name.trim()) return null;
  return {
    id: typeof item.id === 'string' && item.id ? item.id : `legacy:${item.type === 'income' ? 'income' : 'expense'}:${item.name.trim().toLocaleLowerCase()}`,
    name: item.name.trim(),
    type: item.type === 'income' ? 'income' : 'expense',
    subcategories: Array.isArray(item.subcategories)
      ? item.subcategories.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim())).map((entry) => entry.trim())
      : [],
    ...(typeof item.icon === 'string' ? { icon: item.icon } : {}),
    ...(typeof item.color === 'string' ? { color: item.color } : {}),
    ...(Number.isFinite(Number(item.monthlyBudget)) && Number(item.monthlyBudget) > 0
      ? { monthlyBudget: Number(item.monthlyBudget) }
      : {}),
  };
}
