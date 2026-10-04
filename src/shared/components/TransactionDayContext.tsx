import { CreditCard, Pencil, Trash2 } from 'lucide-react';
import { formatMoney } from '@/features/finance/model/finance';
import type { Account, Transaction } from '@/features/finance/model/types';

export default function TransactionDayContext({ date, transactions, accounts, onEdit, onDelete }: { date: string; transactions: Transaction[]; accounts: Account[]; onEdit: (item: Transaction) => void; onDelete: (id: string) => void }) {
  const entries = transactions.filter((item) => item.date === date).sort((a, b) => Number(b.created || 0) - Number(a.created || 0));
  const totals = entries.reduce((result, item) => {
    if (item.type === 'income') result.income += Number(item.amount) || 0;
    if (item.type === 'expense') result.expense += Number(item.amount) || 0;
    if (item.type === 'payment') result.payment += Number(item.amount) || 0;
    return result;
  }, { income: 0, expense: 0, payment: 0 });
  const dateLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
  const accountName = (id?: string) => accounts.find((item) => item.id === id)?.name || 'Unlinked account';

  return <section className="transaction-day-context" aria-labelledby="transactionDayTitle">
    <header className="transaction-day-context-heading"><div><span className="eyebrow">SELECTED DAY</span><h3 id="transactionDayTitle">{dateLabel}</h3></div><span className="transaction-day-count">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span></header>
    <div className="transaction-day-context-totals">
      <div><span>Income</span><strong className="income-text">+{formatMoney(totals.income)}</strong></div>
      <div><span>Expenses</span><strong className="expense-text">−{formatMoney(totals.expense)}</strong></div>
      <div><span>Card payments</span><strong>{formatMoney(totals.payment)}</strong></div>
      <div><span>Net for day</span><strong className={totals.income < totals.expense ? 'expense-text' : 'income-text'}>{formatMoney(totals.income - totals.expense)}</strong></div>
    </div>
    {entries.length ? <div className="transaction-day-context-list" aria-label="Transactions on selected day">{entries.map((item) => {
      const account = item.type === 'payment' ? `${accountName(item.accountId)} → ${accountName(item.toAccountId)}` : [item.category, item.subcategory, accountName(item.accountId)].filter(Boolean).join(' · ');
      return <article className="transaction-day-context-row" key={item.id}>
        <span className={`transaction-day-context-mark ${item.type}`}>{item.type === 'payment' ? <CreditCard size={13}/> : item.type === 'income' ? '+' : '−'}</span>
        <span className="transaction-day-context-copy"><strong>{item.description}</strong><small>{account}</small></span>
        <strong className={`transaction-day-context-amount ${item.type}`}>{item.type === 'income' ? '+' : item.type === 'payment' ? '↗' : '−'}{formatMoney(item.amount)}</strong>
        <span className="transaction-day-context-actions"><button type="button" onClick={() => onEdit(item)} aria-label={`Edit ${item.description}`}><Pencil size={13}/></button><button type="button" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.description}`}><Trash2 size={13}/></button></span>
      </article>;
    })}</div> : <p className="transaction-day-context-empty">No transactions have been recorded for this day yet.</p>}
  </section>;
}
