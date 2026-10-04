import { supabase } from '@/shared/lib/supabaseClient';
import { normalizeAccount, normalizeCategory, normalizeTransaction, type Account, type Category, type Transaction } from '@/features/finance/model/types';
import { normalizeFundPurchase, normalizeMutualFund, type FundPurchase, type MutualFund } from '@/features/stocks/model/mutualFunds';

export type WorkspaceSnapshot = { transactions: Transaction[]; accounts: Account[]; categories: Category[]; mutualFunds: MutualFund[]; fundPurchases: FundPurchase[] };
type VersionedSnapshot = { revision: number; snapshot: WorkspaceSnapshot };
const baselines = new Map<string, VersionedSnapshot>();

export class WorkspaceConflictError extends Error {
  constructor(readonly conflicts: string[]) {
    super(`Conflicting edits need review: ${conflicts.join(', ')}`);
    this.name = 'WorkspaceConflictError';
  }
}

const emptySnapshot = (): WorkspaceSnapshot => ({ transactions: [], accounts: [], categories: [], mutualFunds: [], fundPurchases: [] });
function normalizeSnapshot(data: Record<string, unknown>): WorkspaceSnapshot {
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions.map(normalizeTransaction).filter((item): item is Transaction => item !== null) : [],
    accounts: Array.isArray(data.accounts) ? data.accounts.map(normalizeAccount).filter((item): item is Account => item !== null) : [],
    categories: Array.isArray(data.categories) ? data.categories.map(normalizeCategory).filter((item): item is Category => item !== null) : [],
    mutualFunds: Array.isArray(data.mutualFunds) ? data.mutualFunds.map(normalizeMutualFund).filter((item): item is MutualFund => item !== null) : [],
    fundPurchases: Array.isArray(data.fundPurchases) ? data.fundPurchases.map(normalizeFundPurchase).filter((item): item is FundPurchase => item !== null) : [],
  };
}
function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => equal(item, right[index]));
  const a = left as Record<string, unknown>; const b = right as Record<string, unknown>;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].every((key) => equal(a[key], b[key]));
}
function keyed<T>(items: T[], key: (item: T) => string): Map<string, T> { return new Map(items.map((item) => [key(item), item])); }
function mergeList<T>(name: string, base: T[], local: T[], remote: T[], key: (item: T) => string, conflicts: string[]): T[] {
  const b = keyed(base, key); const l = keyed(local, key); const r = keyed(remote, key);
  const result = new Map<string, T>();
  for (const id of new Set([...b.keys(), ...l.keys(), ...r.keys()])) {
    const before = b.get(id); const ours = l.get(id); const theirs = r.get(id);
    const localChanged = !equal(before, ours); const remoteChanged = !equal(before, theirs);
    if (localChanged && remoteChanged && !equal(ours, theirs)) { conflicts.push(`${name}:${id}`); continue; }
    const chosen = localChanged ? ours : theirs;
    if (chosen !== undefined) result.set(id, chosen);
  }
  const baseOrder = base.map(key);
  const localBaseOrder = local.map(key).filter((id) => b.has(id));
  const remoteBaseOrder = remote.map(key).filter((id) => b.has(id));
  const expectedLocalOrder = baseOrder.filter((id) => l.has(id));
  const expectedRemoteOrder = baseOrder.filter((id) => r.has(id));
  const localReordered = localBaseOrder.some((id, index) => id !== expectedLocalOrder[index]);
  const remoteReordered = remoteBaseOrder.some((id, index) => id !== expectedRemoteOrder[index]);
  if (localReordered && remoteReordered && localBaseOrder.join('\u0000') !== remoteBaseOrder.join('\u0000')) conflicts.push(`${name}:order`);
  const preferred = localReordered ? local.map(key) : remoteReordered ? remote.map(key) : baseOrder;
  const orderedIds = [...preferred, ...local.map(key), ...remote.map(key)].filter((id, index, all) => result.has(id) && all.indexOf(id) === index);
  return orderedIds.map((id) => result.get(id)!);
}
function mergeSnapshots(base: WorkspaceSnapshot, local: WorkspaceSnapshot, remote: WorkspaceSnapshot): { snapshot: WorkspaceSnapshot; conflicts: string[] } {
  const conflicts: string[] = [];
  const snapshot = {
    transactions: mergeList('transaction', base.transactions, local.transactions, remote.transactions, (item) => item.id, conflicts),
    accounts: mergeList('account', base.accounts, local.accounts, remote.accounts, (item) => item.id, conflicts),
    categories: mergeList('category', base.categories, local.categories, remote.categories, (item) => item.id || `${item.type}:${item.name.toLocaleLowerCase()}`, conflicts),
    mutualFunds: mergeList('mutual fund', base.mutualFunds, local.mutualFunds, remote.mutualFunds, (item) => item.id, conflicts),
    fundPurchases: mergeList('fund purchase', base.fundPurchases, local.fundPurchases, remote.fundPurchases, (item) => item.id, conflicts),
  };
  return { snapshot, conflicts };
}
async function assertUser(userId: string): Promise<void> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user || user.id !== userId) throw new Error('Your session changed. Sign in again to access this workspace.');
}
async function fetchVersion(userId: string): Promise<VersionedSnapshot | null> {
  await assertUser(userId);
  const { data, error } = await supabase.from('user_workspaces').select('user_id, revision, transactions, accounts, categories, mutual_funds, fund_purchases').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.user_id !== userId) throw new Error('Workspace owner mismatch.');
  return { revision: Number(data.revision) || 0, snapshot: normalizeSnapshot({ ...data, mutualFunds: data.mutual_funds, fundPurchases: data.fund_purchases } as Record<string, unknown>) };
}

export async function loadWorkspace(userId: string): Promise<WorkspaceSnapshot | null> {
  const version = await fetchVersion(userId);
  baselines.set(userId, version || { revision: 0, snapshot: emptySnapshot() });
  if (!version) return null;

  // Legacy SIP imports sometimes used different order/execution days for the
  // same monthly installment. Canonicalize only those mismatched pairs to the
  // first day of the purchase month. saveWorkspace applies this through the
  // authenticated, revision-checked RPC and preserves every other workspace field.
  let datesChanged = false;
  const fundPurchases = version.snapshot.fundPurchases.map((purchase) => {
    if (purchase.purchasedDate === purchase.executionDate) return purchase;
    const month = purchase.purchasedDate.slice(0, 7);
    const monthStart = `${month}-01`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(monthStart)) return purchase;
    datesChanged = true;
    return { ...purchase, purchasedDate: monthStart, executionDate: monthStart };
  });

  if (!datesChanged) return version.snapshot;
  return saveWorkspace(userId, { ...version.snapshot, fundPurchases });
}

export async function saveWorkspace(userId: string, snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
  await assertUser(userId);
  let baseline = baselines.get(userId) || { revision: 0, snapshot: emptySnapshot() };
  let local = normalizeSnapshot(snapshot as unknown as Record<string, unknown>);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase.rpc('save_user_workspace', {
      p_expected_revision: baseline.revision,
      p_transactions: local.transactions,
      p_accounts: local.accounts,
      p_categories: local.categories,
      p_mutual_funds: local.mutualFunds,
      p_fund_purchases: local.fundPurchases,
    });
    if (error) throw error;
    const revision = Array.isArray(data) ? Number(data[0]) : Number(data);
    if (Number.isFinite(revision) && revision > baseline.revision) {
      baselines.set(userId, { revision, snapshot: local });
      return local;
    }

    const remote = await fetchVersion(userId);
    if (!remote) { baseline = { revision: 0, snapshot: emptySnapshot() }; continue; }
    const merged = mergeSnapshots(baseline.snapshot, local, remote.snapshot);
    if (merged.conflicts.length) throw new WorkspaceConflictError(merged.conflicts);
    if (equal(merged.snapshot, remote.snapshot)) {
      baselines.set(userId, remote);
      return remote.snapshot;
    }
    baseline = remote;
    local = merged.snapshot;
  }
  throw new Error('Workspace changed repeatedly while saving. Retry to sync the latest changes.');
}
