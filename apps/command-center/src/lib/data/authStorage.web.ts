/**
 * Web session storage for Supabase Auth: the tab's sessionStorage, so the refreshable
 * session ends with the tab (as in the Vite app). This reduces how long a stolen token
 * lasts; it does not replace Row Level Security. Storage can be unavailable (private
 * windows, blocked site data), in which case the user simply signs in again.
 */
export const authStorage = {
  getItem(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage blocked: the session lives in memory for this page only.
    }
  },
  removeItem(key: string): void {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nothing stored.
    }
  },
};
