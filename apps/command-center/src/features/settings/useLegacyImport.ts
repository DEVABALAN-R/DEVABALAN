import { useCallback, useState } from 'react';
import { flushCloudSync, startCloudSync, stopCloudSync } from '@/features/sync/cloudSync';
import { useSyncStatus } from '@/features/sync/syncStatus';
import { checkLegacyImport, runLegacyImport } from '@/lib/data/legacyImportRepository';
import { RpcError } from '@/lib/data/rpc';
import type { ImportReport } from '@/lib/domain/legacyImport';

export type ImportPhase = 'idle' | 'checking' | 'ready' | 'importing' | 'failed';

/** Says what went wrong without echoing anything the server sent back. */
export function importErrorText(error: unknown): string {
  if (error instanceof RpcError) {
    if (error.code === 'PGRST202' || error.status === 404)
      return 'The import is not set up yet: run migration 0008 in Supabase (see SUPABASE_SETUP.md).';
    if (error.code === '57014')
      return 'The database took too long. Try once more; if it happens again, run the import from the SQL editor (SUPABASE_SETUP.md).';
    if (error.status === 401) return 'Your session has ended. Sign in again, then retry.';
    if (error.status === 0) return 'No connection. Check your internet and retry.';
  }
  return 'Something went wrong. Nothing was changed; try again.';
}

/**
 * The check-then-import flow. Importing first saves any waiting changes, pauses sync while
 * the database adds the old rows, then reloads everything so the new rows appear.
 */
export function useLegacyImport() {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState('');

  const settle = useCallback((next: ImportReport) => {
    setReport(next);
    setError(next.status === 'error' ? `The database refused the import: ${next.message}` : '');
    setPhase(next.status === 'error' ? 'failed' : 'ready');
  }, []);

  const check = useCallback(async () => {
    setPhase('checking');
    setError('');
    try {
      settle(await checkLegacyImport());
    } catch (caught) {
      setError(importErrorText(caught));
      setPhase('failed');
    }
  }, [settle]);

  const runImport = useCallback(async (): Promise<ImportReport | null> => {
    setPhase('importing');
    setError('');
    await flushCloudSync();
    if (useSyncStatus.getState().status !== 'saved') {
      setError('Some of your changes are still waiting to be saved. Try again once they are.');
      setPhase('ready');
      return null;
    }
    stopCloudSync();
    try {
      const result = await runLegacyImport();
      settle(result);
      return result;
    } catch (caught) {
      setError(importErrorText(caught));
      setPhase('failed');
      return null;
    } finally {
      await startCloudSync();
    }
  }, [settle]);

  return { phase, report, error, check, runImport };
}
