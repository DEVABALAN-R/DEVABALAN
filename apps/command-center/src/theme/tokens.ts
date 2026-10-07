/**
 * Platform-neutral design tokens. Components read these through `useTheme()`;
 * nothing outside src/theme should contain raw sizes or hex colours.
 */

export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  14: 56,
  18: 72,
} as const;
export type SpaceToken = keyof typeof space;

export const radius = { xs: 6, sm: 10, md: 14, lg: 20, xl: 26, pill: 999 } as const;
export type RadiusToken = keyof typeof radius;

export const breakpoints = { sm: 0, md: 768, lg: 1024, xl: 1440 } as const;
export type Breakpoint = keyof typeof breakpoints;

/** Minimum touch target (WCAG 2.5.5 / platform guidance). */
export const minHitSize = 44;

export const layout = {
  /** Floating icon rail on tablet/desktop. */
  railWidth: 64,
  /** Floating pill tab bar on phones (excluding safe-area inset). */
  bottomBarHeight: 72,
  contentMaxWidth: 1480,
  headerHeight: 60,
  /** Outer canvas padding around the floating chrome on desktop. */
  canvasPadding: 16,
} as const;

export const duration = { instant: 0, fast: 120, base: 200, slow: 320 } as const;
export type DurationToken = keyof typeof duration;

export const spring = { damping: 20, stiffness: 220, mass: 1 } as const;
