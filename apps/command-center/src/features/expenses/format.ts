import {
  formatAxisMoney,
  formatMoney,
  formatMoneyWhole,
  moneyAccessibilityLabel,
  type SignDisplay,
} from '@/lib/formatting/currency';

/** Entry amounts read like a ledger: "₹120" when there are no paise, else "₹120.50". */
export function formatEntry(minor: number, signDisplay: SignDisplay = 'auto'): string {
  return minor % 100 === 0
    ? formatMoneyWhole(minor, signDisplay)
    : formatMoney(minor, { signDisplay });
}

export function speakEntry(minor: number, signDisplay: SignDisplay = 'auto'): string {
  return moneyAccessibilityLabel(minor, { signDisplay, whole: minor % 100 === 0 });
}

/** Compact signed label for calendar cells: "+₹10K", "−₹150". */
export function signedCompact(minor: number, sign: '+' | '−'): string {
  return `${sign}${formatAxisMoney(Math.abs(minor))}`;
}
