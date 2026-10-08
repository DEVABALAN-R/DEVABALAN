import { useSession } from '@/features/auth/sessionStore';
import { getLedger, useExpenseStore } from '@/features/expenses/state/expenseStore';
import { useNotesStore } from '@/features/notes/state/notesStore';
import {
  buildChanges,
  loadCloudData,
  saveChanges,
  type CloudData,
} from '@/lib/data/ledgerRepository';
import { RpcError } from '@/lib/data/rpc';
import { useSyncStatus } from './syncStatus';

/**
 * Keeps the in-memory stores and the user's cloud data in step. After sign-in it loads
 * everything, then watches the stores: shortly after a change it sends the difference
 * from the last saved copy as one atomic batch (`sync_ledger`). Offline or server
 * errors are retried with back-off; a change the database refuses is rolled back by
 * reloading. Screens keep calling the same store actions as in preview mode.
 */
const DEBOUNCE_MS = 600;
const MAX_BACKOFF_MS = 30_000;

let generation = 0;
let baseline: CloudData | null = null;
let unsubscribers: (() => void)[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;
let pending = false;
let attempt = 0;

const snapshot = (): CloudData => {
  const { accounts, categories, people, transactions } = getLedger();
  return { accounts, categories, people, transactions, notes: useNotesStore.getState().notes };
};

const setStatus = (status: Parameters<ReturnType<typeof useSyncStatus.getState>['set']>[0]) =>
  useSyncStatus.getState().set(status);

function applyToStores(data: CloudData) {
  const { notes, ...ledger } = data;
  useExpenseStore.setState(ledger);
  useNotesStore.setState({ notes });
}

function clearTimer() {
  if (timer) clearTimeout(timer);
  timer = null;
}

function schedule(delay = DEBOUNCE_MS) {
  clearTimer();
  timer = setTimeout(() => void flush(), delay);
}

/** Starts syncing for the signed-in user: replaces sample data with theirs. */
export async function startCloudSync(): Promise<void> {
  stopCloudSync();
  const run = ++generation;
  // Never show sample data as if it were the user's, even for a moment.
  applyToStores({ accounts: [], categories: [], people: [], transactions: [], notes: [] });
  setStatus('loading');
  let data: CloudData;
  try {
    data = await loadCloudData();
  } catch {
    if (run === generation) setStatus('loadFailed');
    return;
  }
  if (run !== generation) return;
  baseline = data;
  applyToStores(data);
  setStatus('saved');
  unsubscribers = [
    useExpenseStore.subscribe(() => schedule()),
    useNotesStore.subscribe(() => schedule()),
  ];
}

/**
 * Stops watching the stores. Must run before the stores are cleared on sign-out, so the
 * clearing is never mistaken for the user deleting everything.
 */
export function stopCloudSync(): void {
  generation += 1;
  unsubscribers.forEach((unsubscribe) => unsubscribe());
  unsubscribers = [];
  clearTimer();
  baseline = null;
  pending = false;
  attempt = 0;
  inFlight = null;
  setStatus('off');
}

/** Sends any waiting changes now (before signing out, for example). */
export async function flushCloudSync(): Promise<void> {
  clearTimer();
  await flush();
  if (inFlight) await inFlight;
}

async function flush(): Promise<void> {
  if (inFlight) {
    pending = true;
    return inFlight;
  }
  const run = generation;
  // Only a signed-in user's own session may write (never while signing out).
  if (!baseline || useSession.getState().status !== 'signedIn') return;
  const next = snapshot();
  const changes = buildChanges(baseline, next);
  if (!changes) {
    setStatus('saved');
    return;
  }
  setStatus('saving');
  inFlight = (async () => {
    try {
      await saveChanges(changes);
      if (run !== generation) return;
      baseline = next;
      attempt = 0;
      setStatus('saved');
    } catch (error) {
      if (run !== generation) return;
      if (error instanceof RpcError && !error.retryable) {
        // The database refused the change: show the saved state again.
        await reload(run);
        return;
      }
      attempt += 1;
      setStatus('retrying');
      schedule(Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt));
    }
  })();
  try {
    await inFlight;
  } finally {
    if (run === generation) inFlight = null;
  }
  if (run === generation && pending) {
    pending = false;
    void flush();
  }
}

async function reload(run: number): Promise<void> {
  try {
    const data = await loadCloudData();
    if (run !== generation) return;
    baseline = data;
    applyToStores(data);
    useSyncStatus.getState().setRejected(true);
    setStatus('saved');
  } catch {
    if (run === generation) setStatus('retrying');
  }
}
