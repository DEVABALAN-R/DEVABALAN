import type { Account, Category, Person, Transaction } from '@/lib/domain/expenses';
import type { Portfolio } from '@/lib/domain/investments';
import type { Note } from '@/lib/domain/notes';
import { diffById, isEmptyDiff } from '@/lib/domain/sync';
import { portfolioChanges, portfolioFromRemote, type RemotePortfolio } from './portfolioRows';
import { callRpc } from './rpc';

/** Everything the app keeps in the cloud for one user. */
export type CloudData = {
  accounts: Account[];
  categories: Category[];
  people: Person[];
  transactions: Transaction[];
  notes: Note[];
  /** Mutual funds and stocks (migration 0007). */
  portfolio: Portfolio;
};

type InvestmentKey = 'mf_funds' | 'mf_sips' | 'mf_transactions' | 'stocks' | 'stock_trades';

/** One batch for `sync_ledger`, in the database's column names. */
export type LedgerChanges = Partial<Record<InvestmentKey, unknown[]>> & {
  accounts?: unknown[];
  categories?: unknown[];
  people?: unknown[];
  transactions?: unknown[];
  notes?: unknown[];
  deleted?: Partial<
    Record<
      'accounts' | 'categories' | 'people' | 'transactions' | 'notes' | InvestmentKey,
      string[]
    >
  >;
};

type Row = Record<string, unknown>;
type Raw = RemotePortfolio &
  Partial<
    Record<
      'accounts' | 'categories' | 'people' | 'transactions' | 'splits' | 'settles' | 'notes',
      Row[]
    >
  >;

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const time = (value: unknown) => {
  const parsed = Date.parse(str(value));
  return Number.isFinite(parsed) ? parsed : 0;
};
const isoTime = (ms: number) => new Date(ms || Date.now()).toISOString();

/** Turns `load_ledger()` output into the app's types. */
export function fromRemote(raw: Raw | null): CloudData {
  const data = raw ?? {};
  const splits = new Map<string, Transaction['splits'] & object>();
  for (const row of data.splits ?? []) {
    const list = splits.get(str(row.transaction_id)) ?? [];
    list.push({ personId: str(row.person_id), amount: num(row.amount) });
    splits.set(str(row.transaction_id), list);
  }
  const settles = new Map<string, string[]>();
  for (const row of data.settles ?? []) {
    const list = settles.get(str(row.repayment_id)) ?? [];
    list.push(str(row.expense_id));
    settles.set(str(row.repayment_id), list);
  }
  return {
    accounts: (data.accounts ?? []).map((row) => ({
      id: str(row.id),
      name: str(row.name),
      group: str(row.account_group) as Account['group'],
      openingBalance: num(row.opening_balance),
      order: num(row.sort_order),
    })),
    categories: (data.categories ?? []).map((row) => ({
      id: str(row.id),
      kind: str(row.kind) as Category['kind'],
      parentId: (row.parent_id as string | null) ?? null,
      name: str(row.name),
      icon: str(row.icon),
      tint: num(row.tint),
      budget: row.budget === null || row.budget === undefined ? null : num(row.budget),
      order: num(row.sort_order),
    })),
    people: (data.people ?? []).map((row) => ({
      id: str(row.id),
      name: str(row.name),
      order: num(row.sort_order),
    })),
    transactions: (data.transactions ?? []).map((row) => {
      const id = str(row.id);
      const transaction: Transaction = {
        id,
        kind: str(row.kind) as Transaction['kind'],
        date: str(row.occurred_on),
        amount: num(row.amount),
        accountId: str(row.account_id),
        toAccountId: (row.to_account_id as string | null) ?? null,
        fee: num(row.fee),
        categoryId: (row.category_id as string | null) ?? null,
        note: str(row.note),
        createdAt: time(row.created_at),
        splits: splits.get(id) ?? [],
        personId: (row.person_id as string | null) ?? null,
        settles: settles.get(id) ?? [],
      };
      return transaction;
    }),
    notes: (data.notes ?? []).map((row) => ({
      id: str(row.id),
      title: str(row.title),
      body: str(row.body),
      items: Array.isArray(row.items) ? (row.items as Note['items']) : null,
      color: (str(row.color) || 'default') as Note['color'],
      pinned: row.pinned === true,
      archived: row.archived === true,
      labels: Array.isArray(row.labels) ? (row.labels as string[]) : [],
      createdAt: time(row.created_at),
      updatedAt: time(row.updated_at),
    })),
    portfolio: portfolioFromRemote(data),
  };
}

const accountRow = (a: Account) => ({
  id: a.id,
  name: a.name,
  account_group: a.group,
  opening_balance: a.openingBalance,
  sort_order: a.order,
});
const categoryRow = (c: Category) => ({
  id: c.id,
  kind: c.kind,
  parent_id: c.parentId,
  name: c.name,
  icon: c.icon,
  tint: c.tint,
  budget: c.budget,
  sort_order: c.order,
});
const personRow = (p: Person) => ({ id: p.id, name: p.name, sort_order: p.order });
// The receipt photo stays on the device (private storage arrives in Phase 5).
const transactionRow = (t: Transaction) => ({
  id: t.id,
  kind: t.kind,
  occurred_on: t.date,
  amount: t.amount,
  account_id: t.accountId,
  to_account_id: t.toAccountId,
  fee: t.fee,
  category_id: t.categoryId,
  note: t.note,
  person_id: t.personId ?? null,
  created_at: isoTime(t.createdAt),
  splits: (t.splits ?? []).map((s) => ({ person_id: s.personId, amount: s.amount })),
  settles: t.settles ?? [],
});
const noteRow = (n: Note) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  // Fixed key order: the database stores JSON objects with its own key order.
  items: n.items?.map((item) => ({ id: item.id, text: item.text, done: item.done })) ?? null,
  color: n.color,
  pinned: n.pinned,
  archived: n.archived,
  labels: n.labels,
  created_at: isoTime(n.createdAt),
});

/** The batch that turns `previous` into `next` in the cloud, or null when nothing changed. */
export function buildChanges(previous: CloudData, next: CloudData): LedgerChanges | null {
  const accounts = diffById(previous.accounts, next.accounts, accountRow);
  const categories = diffById(previous.categories, next.categories, categoryRow);
  const people = diffById(previous.people, next.people, personRow);
  const transactions = diffById(previous.transactions, next.transactions, transactionRow);
  // Edit times alone are not changes; the server keeps its own.
  const notes = diffById(previous.notes, next.notes, noteRow);
  const portfolio = portfolioChanges(previous.portfolio, next.portfolio);
  if (isEmptyDiff([accounts, categories, people, transactions, notes, ...portfolio.diffs])) {
    return null;
  }
  return {
    ...portfolio.upserts,
    accounts: accounts.upserts.map(accountRow),
    categories: categories.upserts.map(categoryRow),
    people: people.upserts.map(personRow),
    transactions: transactions.upserts.map(transactionRow),
    notes: notes.upserts.map(noteRow),
    deleted: {
      accounts: accounts.deletes,
      categories: categories.deletes,
      people: people.deletes,
      transactions: transactions.deletes,
      notes: notes.deletes,
      ...portfolio.deletes,
    },
  };
}

export async function loadCloudData(): Promise<CloudData> {
  return fromRemote(await callRpc<Raw>('load_ledger'));
}

export async function saveChanges(changes: LedgerChanges): Promise<void> {
  await callRpc<null>('sync_ledger', { p_changes: changes });
}
