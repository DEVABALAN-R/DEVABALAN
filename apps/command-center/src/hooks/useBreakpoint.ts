import { useWindowDimensions } from 'react-native';
import { breakpoints, type Breakpoint } from '@/theme/tokens';

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  return 'sm';
}

export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

export function layoutModeForWidth(width: number): LayoutMode {
  const breakpoint = breakpointForWidth(width);
  if (breakpoint === 'sm') return 'mobile';
  if (breakpoint === 'md') return 'tablet';
  return 'desktop';
}

/** Responsive state derived from the window (not the device type). */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const breakpoint = breakpointForWidth(width);
  const mode = layoutModeForWidth(width);
  return { width, breakpoint, mode, isMobile: mode === 'mobile', isDesktop: mode === 'desktop' };
}
