import { fireEvent, screen } from '@testing-library/react-native';
import { flushCloudSync, startCloudSync, stopCloudSync } from '@/features/sync/cloudSync';
import { useSyncStatus } from '@/features/sync/syncStatus';
import { RAW_PREVIEW } from '@/lib/data/__fixtures__/legacyImport';
import {
  checkLegacyImport,
  importReportFromRemote,
  runLegacyImport,
} from '@/lib/data/legacyImportRepository';
import { RpcError } from '@/lib/data/rpc';
import { renderWithProviders } from '@/test/render';
import { LegacyImportCard } from '../LegacyImportCard';

jest.mock('@/lib/data/legacyImportRepository', () => ({
  ...jest.requireActual('@/lib/data/legacyImportRepository'),
  checkLegacyImport: jest.fn(),
  runLegacyImport: jest.fn(),
}));
jest.mock('@/features/sync/cloudSync', () => ({
  flushCloudSync: jest.fn(),
  startCloudSync: jest.fn(),
  stopCloudSync: jest.fn(),
}));

const preview = importReportFromRemote(RAW_PREVIEW);
const imported = importReportFromRemote({
  ...RAW_PREVIEW,
  status: 'imported',
  imported_at: '2026-10-10T09:30:00Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  useSyncStatus.setState({ status: 'saved' });
});

describe('LegacyImportCard', () => {
  it('checks first, shows the summary and the report', async () => {
    jest.mocked(checkLegacyImport).mockResolvedValue(preview);
    await renderWithProviders(<LegacyImportCard index={0} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check old data' }));
    expect(
      await screen.findByText('Adds 9 entries, 2 accounts, 2 funds, 3 fund purchases.'),
    ).toBeTruthy();
    expect(screen.getByText(/6 items cannot be brought over/)).toBeTruthy();
    expect(screen.getByText('Totals match')).toBeTruthy();
    expect(runLegacyImport).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('button', { name: 'View report' }));
    expect(await screen.findByText('Import check')).toBeTruthy();
    expect(screen.getByText('Old app ₹59,339.65 · here ₹58,239.65')).toBeTruthy();
    expect(screen.getByText(/−₹1,200.00 from card payments and transfers/)).toBeTruthy();
    expect(screen.getByText('Called “Credit card” in the old app.')).toBeTruthy();
    expect(screen.getByText(/its own opening balance is kept: −₹500.00/)).toBeTruthy();
    expect(screen.getByText('2 of 3 category totals match exactly.')).toBeTruthy();
    expect(screen.getByText('₹150.00 in entries that cannot be brought over.')).toBeTruthy();
    expect(screen.getByText('Invalid date')).toBeTruthy();
    expect(screen.getByText('3 entries')).toBeTruthy();
  });

  it('imports after confirming: saves changes, pauses sync, reloads', async () => {
    jest.mocked(checkLegacyImport).mockResolvedValue(preview);
    jest.mocked(runLegacyImport).mockResolvedValue(imported);
    await renderWithProviders(<LegacyImportCard index={0} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check old data' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Import' }));
    expect(await screen.findByText('Import from the old app?')).toBeTruthy();
    const buttons = screen.getAllByRole('button', { name: 'Import' });
    await fireEvent.press(buttons[buttons.length - 1]);
    expect(flushCloudSync).toHaveBeenCalled();
    expect(stopCloudSync).toHaveBeenCalled();
    expect(runLegacyImport).toHaveBeenCalled();
    expect(startCloudSync).toHaveBeenCalled();
    expect(await screen.findByText(/^Imported /)).toBeTruthy();
    expect(
      screen.getAllByText('Added 9 entries, 2 accounts, 2 funds, 3 fund purchases.').length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Check again' })).toBeTruthy();
  });

  it('waits while changes are still unsaved', async () => {
    jest.mocked(checkLegacyImport).mockResolvedValue(preview);
    await renderWithProviders(<LegacyImportCard index={0} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check old data' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Import' }));
    useSyncStatus.setState({ status: 'retrying' });
    const buttons = screen.getAllByRole('button', { name: 'Import' });
    await fireEvent.press(buttons[buttons.length - 1]);
    expect(await screen.findByText(/still waiting to be saved/)).toBeTruthy();
    expect(stopCloudSync).not.toHaveBeenCalled();
    expect(runLegacyImport).not.toHaveBeenCalled();
  });

  it('explains a missing migration and an empty old workspace', async () => {
    jest.mocked(checkLegacyImport).mockRejectedValueOnce(new RpcError(404, 'PGRST202'));
    await renderWithProviders(<LegacyImportCard index={0} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Check old data' }));
    expect(await screen.findByText(/run migration 0008/)).toBeTruthy();
    jest
      .mocked(checkLegacyImport)
      .mockResolvedValueOnce(importReportFromRemote({ status: 'none' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check old data' }));
    expect(await screen.findByText('The old app has no saved data for this account.')).toBeTruthy();
  });
});
