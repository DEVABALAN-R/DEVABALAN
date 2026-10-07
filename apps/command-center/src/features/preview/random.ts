/** Deterministic pseudo-random numbers so sample data is stable between renders. */
export function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Whole rupees → integer paise. */
export const rupees = (amount: number) => Math.round(amount) * 100;

export const monthShort = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date);

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Labels for the last `count` months ending with the current one. */
export function recentMonths(count: number, today = new Date()): Date[] {
  return Array.from(
    { length: count },
    (_, index) => new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1),
  );
}
