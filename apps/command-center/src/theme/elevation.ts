import type { ViewStyle } from 'react-native';

export type ElevationLevel = 0 | 1 | 2 | 3;

/** Cross-platform `boxShadow` (RN New Architecture + RN Web). Dark mode relies on
 * surface tints instead of shadows, so dark elevations are hairline-only. */
export function elevation(level: ElevationLevel, scheme: 'light' | 'dark'): ViewStyle {
  if (level === 0 || scheme === 'dark') return {};
  const shadows: Record<Exclude<ElevationLevel, 0>, string> = {
    1: '0px 1px 3px rgba(15, 23, 42, 0.06), 0px 1px 2px rgba(15, 23, 42, 0.04)',
    2: '0px 8px 24px rgba(15, 23, 42, 0.10), 0px 2px 6px rgba(15, 23, 42, 0.06)',
    3: '0px 24px 48px rgba(15, 23, 42, 0.18), 0px 4px 12px rgba(15, 23, 42, 0.08)',
  };
  return { boxShadow: shadows[level] };
}
