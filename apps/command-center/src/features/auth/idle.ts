/** Automatic sign-out after inactivity: same defaults as the old app (30 min, 2 min warning). */
export const IDLE_MINUTES = 30;
export const IDLE_TIMEOUT_MS = IDLE_MINUTES * 60_000;
export const IDLE_WARNING_MS = 2 * 60_000;

export type IdlePhase = 'active' | 'warning' | 'expired';

/** Where an idle session stands `now`, given the last activity time. */
export function idlePhase(
  now: number,
  lastActive: number,
  timeout = IDLE_TIMEOUT_MS,
  warning = IDLE_WARNING_MS,
): IdlePhase {
  const idle = now - lastActive;
  if (idle >= timeout) return 'expired';
  if (idle >= timeout - warning) return 'warning';
  return 'active';
}
