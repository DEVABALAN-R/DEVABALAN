import React from 'react';
import { compactMoney, dateKey } from '@/features/finance/model/finance';
import type { Transaction } from '@/features/finance/model/types';

type CalendarProps = {
  month: Date;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  transactions: Transaction[];
  onSelectDay: (date: string) => void;
};

type DailyTotals = { income: number; expense: number; payment: number; count: number };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function totalsByDate(transactions: Transaction[]): Record<string, DailyTotals> {
  return transactions.reduce<Record<string, DailyTotals>>((totals, transaction) => {
    const day = totals[transaction.date] ??= { income: 0, expense: 0, payment: 0, count: 0 };
    day.count += 1;
    if (transaction.type === 'income') day.income += transaction.amount;
    if (transaction.type === 'expense') day.expense += transaction.amount;
    if (transaction.type === 'payment') day.payment += transaction.amount;
    return totals;
  }, {});
}

export default function Calendar({ month, selectedDate, setSelectedDate, transactions, onSelectDay }: CalendarProps) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const firstCell = new Date(year, monthIndex, 1 - offset);
  const dailyTotals = React.useMemo(() => totalsByDate(transactions), [transactions]);
  const maxDailySpend = Math.max(1, ...Object.values(dailyTotals).map((day) => day.expense));
  const today = dateKey(new Date());

  return <section className="panel calendar-panel" id="calendar" aria-label="Daily activity calendar" style={{ '--weeks': weeks } as React.CSSProperties}>
    <div className="calendar-content">
      <div className="calendar-main">
        <div className="calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {Array.from({ length: weeks * 7 }, (_, index) => {
            const date = new Date(firstCell);
            date.setDate(firstCell.getDate() + index);
            const key = dateKey(date);
            const inMonth = date.getMonth() === monthIndex;
            const totals = dailyTotals[key] ?? { income: 0, expense: 0, payment: 0, count: 0 };
            const intensity = Math.min(22, totals.expense / maxDailySpend * 22);
            const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
            const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date);
            const totalActivity = totals.income + totals.expense || 1;
            const style = {
              '--spend-intensity': `${intensity}%`,
              '--income-share': `${totals.income / totalActivity * 100}%`,
              '--expense-share': `${totals.expense / totalActivity * 100}%`,
            } as React.CSSProperties;
            const weekend = index % 7 >= 5;
            if (!inMonth) {
              return <div key={key} className={`calendar-cell outside${weekend ? ' weekend' : ''}`} aria-hidden="true"><span className="calendar-cell-date">{date.getDate()}</span></div>;
            }
            return <button key={key} type="button" style={style} className={`calendar-cell${key === selectedDate ? ' selected' : ''}${key === today ? ' today' : ''}${totals.count ? ' has-data' : ''}${weekend ? ' weekend' : ''}`} onClick={() => { setSelectedDate(key); onSelectDay(key); }} aria-pressed={key === selectedDate} aria-label={`${dateLabel}${totals.count ? `, ${totals.count} transactions, income ${compactMoney.format(totals.income)}, expenses ${compactMoney.format(totals.expense)}` : ', no transactions'}`} title={`${dateLabel}${totals.income ? ` · Income ${compactMoney.format(totals.income)}` : ''}${totals.expense ? ` · Expenses ${compactMoney.format(totals.expense)}` : ''}`}>
              <span className="calendar-cell-date">{date.getDate()}</span>
              <span className="calendar-cell-weekday">{weekday}</span>
              <span className={`calendar-cell-total${totals.expense > 0 ? ' expense' : totals.income > 0 ? ' income' : ''}`}>{totals.expense > 0 ? `−${compactMoney.format(totals.expense)}` : totals.income > 0 ? `+${compactMoney.format(totals.income)}` : ''}</span>
              <span className="calendar-cell-mobile-totals"><span className="income">{totals.income ? `+${compactMoney.format(totals.income)}` : '—'}</span><span className="expense">{totals.expense ? `−${compactMoney.format(totals.expense)}` : '—'}</span></span>
              <span className="calendar-cell-bar" aria-hidden="true"><i/><b/></span>
            </button>;
          })}
        </div>
      </div>
    </div>
  </section>;
}
