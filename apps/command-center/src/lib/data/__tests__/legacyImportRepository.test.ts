import { RAW_PREVIEW } from '../__fixtures__/legacyImport';
import {
  checkLegacyImport,
  importReportFromRemote,
  runLegacyImport,
} from '../legacyImportRepository';
import { callRpc } from '../rpc';

jest.mock('../rpc', () => ({ ...jest.requireActual('../rpc'), callRpc: jest.fn() }));

describe('importReportFromRemote', () => {
  it('maps the check report', () => {
    const report = importReportFromRemote(RAW_PREVIEW);
    expect(report.status).toBe('preview');
    expect(report.asOf).toBe('2026-10-10');
    expect(report.importedAt).toBeNull();
    expect(report.counts.transactions).toEqual({ legacy: 13, added: 9, reused: 0, skipped: 4 });
    expect(report.counts.categories.subcategoriesAdded).toBe(5);
    expect(report.accounts[1]).toEqual({
      name: 'Sample Card',
      legacyName: 'Credit card',
      group: 'card',
      reused: false,
      legacy: -250000,
      current: -248000,
      transfers: 2000,
      skipped: 0,
    });
    expect(report.categories[2]).toEqual({
      kind: 'expense',
      name: '',
      legacy: 1010,
      current: 1010,
    });
    expect(report.funds[0]).toMatchObject({ legacyUnits: 109.8268, currentInvested: 1000000 });
    expect(report.skipped).toHaveLength(3);
  });

  it('keeps only the status for "none" and the message for errors', () => {
    expect(importReportFromRemote({ status: 'none' })).toMatchObject({
      status: 'none',
      accounts: [],
    });
    expect(importReportFromRemote({ status: 'error', message: 'refused' })).toMatchObject({
      status: 'error',
      message: 'refused',
    });
  });

  it('treats anything unexpected as an error with empty lines', () => {
    const report = importReportFromRemote({ status: 'weird', accounts: 'x', counts: 5 });
    expect(report.status).toBe('error');
    expect(report.accounts).toEqual([]);
    expect(importReportFromRemote(null).status).toBe('error');
    const odd = importReportFromRemote({
      status: 'preview',
      accounts: [{ legacy: 1.6, new: 'x' }],
    });
    expect(odd.accounts[0]).toMatchObject({ name: '', legacy: 2, current: 0, reused: false });
  });
});

describe('calls', () => {
  it('checks without saving, then imports', async () => {
    jest.mocked(callRpc).mockResolvedValue(RAW_PREVIEW);
    await checkLegacyImport();
    expect(callRpc).toHaveBeenLastCalledWith('import_legacy_workspace', { p_commit: false });
    await runLegacyImport();
    expect(callRpc).toHaveBeenLastCalledWith('import_legacy_workspace', { p_commit: true });
  });
});
