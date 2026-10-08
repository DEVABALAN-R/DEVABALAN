import { create } from 'zustand';
import { EMPTY_MARKET, type MarketData } from '@/lib/domain/investments';
import { loadMarket, refreshMarket, type RefreshResult } from '@/lib/data/marketRepository';
import { RpcError } from '@/lib/data/rpc';
import { seedPortfolio } from './seedPortfolio';

/**
 * Prices for the holdings: the labelled sample in preview mode; signed in, the public
 * NAVs and closing prices the server stored (load_market). "Update prices" asks the
 * market-refresh function to fetch new ones, then reloads.
 */
export type MarketMode = 'preview' | 'cloud';

type MarketStore = {
  mode: MarketMode;
  market: MarketData;
  loading: boolean;
  refreshing: boolean;
  /** A short message about the last refresh or load problem (never a raw error). */
  notice: string | null;
  load: () => Promise<void>;
  refresh: () => Promise<string>;
  enterPreview: () => void;
  enterCloud: () => void;
};

/** What the user is told after "Update prices". */
export function describeRefresh(result: RefreshResult): string {
  if (result.busy) return 'An update is already running. Check again in a minute.';
  const parts: string[] = [];
  const navs = result.navs?.status;
  const prices = result.prices?.status;
  if (navs === 'ok') parts.push('NAVs updated');
  if (prices === 'ok') parts.push('closing prices updated');
  if (navs === 'failed') parts.push('NAVs could not be fetched');
  if (prices === 'failed') parts.push('closing prices could not be fetched');
  if (!parts.length) return 'Prices are already up to date.';
  const text = parts.join('; ');
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  mode: 'preview',
  market: seedPortfolio().market,
  loading: false,
  refreshing: false,
  notice: null,

  load: async () => {
    if (get().mode !== 'cloud') return;
    set({ loading: true });
    try {
      const market = await loadMarket();
      if (get().mode === 'cloud') set({ market, loading: false });
    } catch {
      set({ loading: false, notice: 'Prices could not be loaded. Values use the last known NAV.' });
    }
  },

  refresh: async () => {
    if (get().mode !== 'cloud') return 'Sample prices are fixed in the preview.';
    set({ refreshing: true });
    let message: string;
    try {
      message = describeRefresh(await refreshMarket());
      await get().load();
    } catch (error) {
      message =
        error instanceof RpcError && error.status === 404
          ? 'Automatic prices are not set up yet (see SUPABASE_SETUP.md). You can enter a NAV or price by hand.'
          : 'Prices could not be updated. Check your connection and try again.';
    }
    set({ refreshing: false, notice: message });
    return message;
  },

  enterPreview: () =>
    set({ mode: 'preview', market: seedPortfolio().market, notice: null, loading: false }),
  enterCloud: () => set({ mode: 'cloud', market: EMPTY_MARKET, notice: null }),
}));
