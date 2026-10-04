export type ThemePreference = 'light' | 'dark';

const THEME_KEY = 'devabalan.theme';
const RECENT_SEARCHES_KEY = 'devabalan.recent-searches';

export function readThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';
}

export function saveThemePreference(theme: ThemePreference): void {
  localStorage.setItem(THEME_KEY, theme);
  document.documentElement.dataset.theme = theme;
}

export function readRecentSearches(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearches(searches: string[]): void {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, 5)));
}

export function clearObsoleteLocalCredentials(): void {
  localStorage.removeItem('devabalan.dashboard.credentials.v1');
  sessionStorage.removeItem('devabalan.dashboard.unlocked.v1');
}
