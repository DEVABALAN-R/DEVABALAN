/**
 * Display-only money formatting. Amounts arrive as integer minor units (paise)
 * so calculation code never handles fractional rupees; rounding happens here,
 * at the display boundary, and nowhere else.
 */
export type SignDisplay = 'auto' | 'always' | 'never';

type FormatOptions = {
  currency?: string;
  compact?: boolean;
  signDisplay?: SignDisplay;
  locale?: string;
};

const formatterCache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${locale}|${currency}|${compact}`;
  let cached = formatterCache.get(key);
  if (!cached) {
    cached = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...(compact
        ? { notation: 'compact', maximumFractionDigits: 1 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    formatterCache.set(key, cached);
  }
  return cached;
}

export function assertMinorUnits(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Money must be an integer number of minor units, received ${value}`);
  }
}

/** Formats e.g. 125050 → "₹1,250.50"; negative values use a true minus sign. */
export function formatMoney(minor: number, options: FormatOptions = {}): string {
  assertMinorUnits(minor);
  const { currency = 'INR', compact = false, signDisplay = 'auto', locale = 'en-IN' } = options;
  const magnitude = formatter(locale, currency, compact).format(Math.abs(minor) / 100);
  if (minor === 0 || signDisplay === 'never') return magnitude;
  if (minor < 0) return `−${magnitude}`;
  return signDisplay === 'always' ? `+${magnitude}` : magnitude;
}

/** Screen-reader text: never relies on glyphs like "−" being announced. */
export function moneyAccessibilityLabel(minor: number, options: FormatOptions = {}): string {
  const magnitude = formatMoney(Math.abs(minor), { ...options, signDisplay: 'never' });
  if (minor < 0) return `minus ${magnitude}`;
  if (minor > 0 && options.signDisplay === 'always') return `plus ${magnitude}`;
  return magnitude;
}

export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = `${Math.abs(value).toFixed(fractionDigits)}%`;
  if (value > 0) return `+${magnitude}`;
  if (value < 0) return `−${magnitude}`;
  return magnitude;
}
