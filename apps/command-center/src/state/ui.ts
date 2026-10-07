import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

type UiState = {
  themePreference: ThemePreference;
  sidebarCollapsed: boolean;
  quickAddOpen: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  toggleSidebar: () => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
};

/**
 * Small, non-persisted UI state. Persistence moves to `user_preferences`
 * (Supabase) in Phase 3; nothing financial ever lives here.
 */
export const useUiStore = create<UiState>((set) => ({
  themePreference: 'system',
  sidebarCollapsed: false,
  quickAddOpen: false,
  setThemePreference: (themePreference) => set({ themePreference }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openQuickAdd: () => set({ quickAddOpen: true }),
  closeQuickAdd: () => set({ quickAddOpen: false }),
}));
