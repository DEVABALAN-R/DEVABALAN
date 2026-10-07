import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

type UiState = {
  themePreference: ThemePreference;
  searchOpen: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  openSearch: () => void;
  closeSearch: () => void;
};

/**
 * Small, non-persisted UI state. Persistence moves to `user_preferences`
 * (Supabase) in Phase 3; nothing financial ever lives here.
 */
export const useUiStore = create<UiState>((set) => ({
  themePreference: 'system',
  searchOpen: false,
  setThemePreference: (themePreference) => set({ themePreference }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
}));
