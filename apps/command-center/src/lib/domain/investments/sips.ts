import { addDays, addMonths, monthOf } from '../expenses/dates';
import type { FundTxn, Sip } from './types';

const pad = (value: number) => String(value).padStart(2, '0');

/** Instalment dates of a SIP between two dates (inclusive), oldest first. */
export function sipDates(sip: Sip, from: string, to: string): string[] {
  const start = sip.startDate > from ? sip.startDate : from;
  const end = sip.endDate && sip.endDate < to ? sip.endDate : to;
  const dates: string[] = [];
  let month = monthOf(start);
  while (`${month}-01` <= end) {
    const date = `${month}-${pad(sip.day)}`;
    if (date >= start && date <= end && date >= sip.startDate) dates.push(date);
    month = addMonths(month, 1);
  }
  return dates;
}

/** Next instalment on or after `today`, or null when the SIP has ended or is paused. */
export function nextSipDate(sip: Sip, today: string): string | null {
  if (!sip.active) return null;
  return sipDates(sip, today, addDays(today, 62))[0] ?? null;
}

export type UpcomingSip = { sip: Sip; date: string };

/** Active SIPs due in the next `days` days, soonest first. */
export function upcomingSips(sips: Sip[], today: string, days = 31): UpcomingSip[] {
  const until = addDays(today, days);
  return sips
    .map((sip) => ({ sip, date: nextSipDate(sip, today) }))
    .filter((item): item is UpcomingSip => !!item.date && item.date <= until)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Instalments due in the last `lookbackDays` that have no purchase linked to the SIP
 * near that date (NAV allotment can take a few days): the "record it" list.
 */
export function pendingSipInstalments(
  sips: Sip[],
  txns: FundTxn[],
  today: string,
  lookbackDays = 45,
): UpcomingSip[] {
  const from = addDays(today, -lookbackDays);
  const pending: UpcomingSip[] = [];
  for (const sip of sips) {
    if (!sip.active) continue;
    const linked = txns.filter((txn) => txn.sipId === sip.id && txn.kind === 'buy');
    for (const date of sipDates(sip, from, today)) {
      const covered = linked.some(
        (txn) => txn.date >= addDays(date, -5) && txn.date <= addDays(date, 10),
      );
      if (!covered) pending.push({ sip, date });
    }
  }
  return pending.sort((a, b) => a.date.localeCompare(b.date));
}

/** Monthly total of active SIPs, paise. */
export const monthlySipTotal = (sips: Sip[], today: string) =>
  sips
    .filter((sip) => sip.active && (!sip.endDate || sip.endDate >= today))
    .reduce((sum, sip) => sum + sip.amount, 0);
