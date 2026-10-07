import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

type UiState = {
  themePreference: ThemePreference;
  quickAddOpen: boolean;
  searchOpen: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  openSearch: () => void;
  closeSearch: () => void;
};

/**
 * Small, non-persisted UI state. Persistence moves to `user_preferences`
 * (Supabase) in Phase 3; nothing financial ever lives here.
 */
export const useUiStore = create<UiState>((set) => ({
  themePreference: 'system',
  quickAddOpen: false,
  searchOpen: false,
  setThemePreference: (themePreference) => set({ themePreference }),
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}));
