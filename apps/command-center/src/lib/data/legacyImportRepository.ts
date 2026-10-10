import {
  emptyReport,
  type AreaCount,
  type ImportReport,
  type ImportStatus,
} from '@/lib/domain/legacyImport';
import { callRpc } from './rpc';

/**
 * The one-time import of the old app's data (`import_legacy_workspace`, migration 0008).
 * It runs in the database as the signed-in user: a check builds the report and undoes
 * everything; an import keeps the rows. Running it again only adds what is missing.
 */
type Row = Record<string, unknown>;

const STATUSES: readonly ImportStatus[] = ['none', 'preview', 'imported', 'error'];

const obj = (value: unknown): Row =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {};
const list = (value: unknown): Row[] => (Array.isArray(value) ? value.map(obj) : []);
const str = (value: unknown) => (typeof value === 'string' ? value : '');
const strOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
/** Paise arrive as JSON numbers; anything fractional is rounded rather than trusted. */
const paise = (value: unknown) => Math.round(num(value));

const area = (raw: unknown): AreaCount => {
  const row = obj(raw);
  return {
    legacy: num(row.legacy),
    added: num(row.added),
    reused: num(row.reused),
    skipped: num(row.skipped),
  };
};

export function importReportFromRemote(raw: unknown): ImportReport {
  const data = obj(raw);
  const status = STATUSES.find((item) => item === data.status) ?? 'error';
  const report = emptyReport(status, str(data.message));
  if (status === 'none' || status === 'error') return report;
  const counts = obj(data.counts);
  return {
    ...report,
    asOf: strOrNull(data.as_of),
    importedAt: strOrNull(data.imported_at),
    counts: {
      accounts: area(counts.accounts),
      categories: {
        ...area(counts.categories),
        subcategoriesAdded: num(obj(counts.categories).subcategories_added),
      },
      transactions: area(counts.transactions),
      funds: area(counts.funds),
      purchases: area(counts.purchases),
    },
    skipped: list(data.skipped).map((row) => ({
      area: str(row.area),
      reason: str(row.reason),
      count: num(row.count),
    })),
    accounts: list(data.accounts).map((row) => ({
      name: str(row.name),
      legacyName: str(row.legacy_name),
      group: str(row.group),
      reused: row.reused === true,
      legacy: paise(row.legacy),
      current: paise(row.new),
      transfers: paise(row.transfers),
      skipped: paise(row.skipped),
    })),
    categories: list(data.categories).map((row) => ({
      kind: row.kind === 'income' ? ('income' as const) : ('expense' as const),
      name: str(row.name),
      legacy: paise(row.legacy),
      current: paise(row.new),
    })),
    funds: list(data.funds).map((row) => ({
      name: str(row.name),
      reused: row.reused === true,
      legacyInvested: paise(row.legacy_invested),
      currentInvested: paise(row.new_invested),
      legacyUnits: num(row.legacy_units),
      currentUnits: num(row.new_units),
      skipped: num(row.skipped),
    })),
  };
}

/** Works out what an import would do, then undoes it: nothing is saved. */
export async function checkLegacyImport(): Promise<ImportReport> {
  return importReportFromRemote(
    await callRpc<unknown>('import_legacy_workspace', { p_commit: false }),
  );
}

/** Imports for real. Safe to repeat: rows already brought over are skipped. */
export async function runLegacyImport(): Promise<ImportReport> {
  return importReportFromRemote(
    await callRpc<unknown>('import_legacy_workspace', { p_commit: true }),
  );
}
