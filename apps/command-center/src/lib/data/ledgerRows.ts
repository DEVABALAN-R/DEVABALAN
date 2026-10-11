import type { Account, Category, Person } from '@/lib/domain/expenses';
import type { Note } from '@/lib/domain/notes';

/** App rows → `sync_ledger` rows (database column names). */
const isoTime = (ms: number) => new Date(ms || Date.now()).toISOString();

export const accountRow = (a: Account) => ({
  id: a.id,
  name: a.name,
  account_group: a.group,
  opening_balance: a.openingBalance,
  sort_order: a.order,
});
export const categoryRow = (c: Category) => ({
  id: c.id,
  kind: c.kind,
  parent_id: c.parentId,
  name: c.name,
  icon: c.icon,
  tint: c.tint,
  budget: c.budget,
  sort_order: c.order,
});
export const personRow = (p: Person) => ({ id: p.id, name: p.name, sort_order: p.order });
export const noteRow = (n: Note) => ({
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
