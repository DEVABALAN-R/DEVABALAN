import React from 'react';
import { ArrowDownRight, ArrowUpRight, BarChart3, ChevronLeft, ChevronRight, CircleDollarSign, LineChart, PieChart, TrendingUp } from 'lucide-react';
import type { Account, Category, Transaction } from '@/features/finance/model/types';
import { formatMoney, monthKey, monthLabel, monthDate, openingBankBalance } from '@/features/finance/model/finance';
import { categoryChartColors } from '@/features/finance/model/chartColors';
import '@/shared/styles/dashboard-home.css';

type Props = { transactions: Transaction[]; categories: Category[]; accounts: Account[]; onOpenExpense: () => void; onOpenMutualFunds: () => void };
type Point = { key: string; label: string; income: number; expense: number; selected: number };

function monthOffset(month: string, offset: number) {
  const date = monthDate(month); date.setMonth(date.getMonth() + offset); return monthKey(date);
}
function monthTitle(month: string) { return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(monthDate(month)); }
function graphPath(values: number[], max: number, width = 620, height = 176) {
  return values.map((value, index) => `${index ? 'L' : 'M'} ${(index * width) / Math.max(1, values.length - 1)} ${height - (value / max) * (height - 18) - 8}`).join(' ');
}
function piePath(start: number, end: number, radius = 78) {
  const point = (angle: number) => [100 + radius * Math.cos(angle - Math.PI / 2), 100 + radius * Math.sin(angle - Math.PI / 2)];
  const [x1, y1] = point(start); const [x2, y2] = point(end);
  return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
}

export default function DashboardHome({ transactions, categories, accounts, onOpenExpense, onOpenMutualFunds }: Props) {
  const [activeTab, setActiveTab] = React.useState<'finance' | 'stocks'>('finance');
  const [month, setMonth] = React.useState(() => monthKey(new Date()));
  const [type, setType] = React.useState<'expense' | 'income'>('expense');
  const [categoryName, setCategoryName] = React.useState('');
  const [subcategoryName, setSubcategoryName] = React.useState('');
  const category = categories.find((item) => item.type === type && item.name === categoryName);
  React.useEffect(() => { setCategoryName(''); setSubcategoryName(''); }, [type]);
  React.useEffect(() => { setSubcategoryName(''); }, [categoryName]);
  const availableCategories = categories.filter((item) => item.type === type);
  const selectedRows = transactions.filter((item) => item.date.slice(0, 7) === month && item.type === type && (!categoryName || item.category === categoryName) && (!subcategoryName || item.subcategory === subcategoryName));
  const selectedMonthTotal = selectedRows.reduce((sum, item) => sum + item.amount, 0);
  const income = transactions.filter((item) => item.date.slice(0, 7) === month && item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter((item) => item.date.slice(0, 7) === month && item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const net = income - expenses;
  const bankOpening = openingBankBalance(accounts, transactions, month);
  const bankMonthChange = transactions.filter((item) => item.date.slice(0, 7) === month && item.type !== 'payment' && accounts.some((account) => account.id === item.accountId && account.type === 'bank')).reduce((total, item) => total + (item.type === 'income' ? item.amount : -item.amount), 0);
  const closingBalance = bankOpening + bankMonthChange;
  const savingRate = income > 0 ? Math.round((net / income) * 100) : 0;

  const series: Point[] = React.useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const key = monthOffset(month, index - 11);
    const rows = transactions.filter((item) => item.date.slice(0, 7) === key);
    const total = (kind: 'income' | 'expense') => rows.filter((item) => item.type === kind).reduce((sum, item) => sum + item.amount, 0);
    const selected = rows.filter((item) => item.type === type && (!categoryName || item.category === categoryName) && (!subcategoryName || item.subcategory === subcategoryName)).reduce((sum, item) => sum + item.amount, 0);
    return { key, label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(monthDate(key)), income: total('income'), expense: total('expense'), selected };
  }), [month, transactions, type, categoryName, subcategoryName]);
  const lineMax = Math.max(1, ...series.flatMap((row) => categoryName || subcategoryName ? [row.selected] : [row.income, row.expense])) * 1.12;
  const previous = series[10]?.selected || 0;
  const delta = selectedMonthTotal - previous;
  const selectedTitle = subcategoryName || categoryName || (type === 'income' ? 'Income' : 'Expenses');
  const activeSeries = series.map((point) => ({ ...point, selected: categoryName || subcategoryName ? point.selected : type === 'income' ? point.income : point.expense }));
  const breakdown = React.useMemo(() => {
    const totals = selectedRows.reduce<Record<string, number>>((result, item) => {
      const label = categoryName ? (item.subcategory || 'Other') : (item.category || 'Uncategorized');
      result[label] = (result[label] || 0) + item.amount; return result;
    }, {});
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [selectedRows, categoryName]);
  const pieRows = breakdown.length > 7 ? [...breakdown.slice(0, 6), ['Other', breakdown.slice(6).reduce((sum, row) => sum + row[1], 0)] as [string, number]] : breakdown;
  const pieTotal = pieRows.reduce((sum, [, value]) => sum + value, 0);
  let pieAngle = 0;
  const changeTitle = monthTitle(monthOffset(month, -1));

  return <section className="dashboard-home" aria-label="Application insights">
    <header className="insights-page-header"><div><span className="home-eyebrow">PERSONAL DASHBOARD</span><h1>Insights</h1><p>Monthly patterns across your trackers.</p></div><div className="insights-month-control"><button type="button" aria-label="Previous month" onClick={() => setMonth((value) => monthOffset(value, -1))}><ChevronLeft size={16}/></button><strong>{monthTitle(month)}</strong><button type="button" aria-label="Next month" onClick={() => setMonth((value) => monthOffset(value, 1))}><ChevronRight size={16}/></button></div></header>
    <nav className="insights-tracker-tabs" aria-label="Insights sections" role="tablist"><button type="button" role="tab" aria-selected={activeTab === 'finance'} className={activeTab === 'finance' ? 'active' : ''} onClick={() => setActiveTab('finance')}><CircleDollarSign size={15}/> Finance <span>{transactions.length ? 'Live' : 'No entries'}</span></button><button type="button" role="tab" aria-selected={activeTab === 'stocks'} className={activeTab === 'stocks' ? 'active' : ''} onClick={() => setActiveTab('stocks')}><BarChart3 size={15}/> Stocks <span>Coming soon</span></button></nav>

    {activeTab === 'finance' ? <div className="finance-insights-view" role="tabpanel" aria-label="Finance insights">
      <section className="finance-insight-kpis" aria-label="Monthly finance summary">
        <article><span>Income</span><strong>{formatMoney(income)}</strong><small><ArrowUpRight size={12}/> Received this month</small></article>
        <article><span>Expenses</span><strong>{formatMoney(expenses)}</strong><small><ArrowDownRight size={12}/> Spent this month</small></article>
        <article><span>Net cash flow</span><strong className={net < 0 ? 'is-negative' : ''}>{formatMoney(net)}</strong><small>{net >= 0 ? 'Income after expenses' : 'Expenses exceed income'}</small></article>
        <article><span>Closing bank balance</span><strong>{formatMoney(closingBalance)}</strong><small>Includes carried balance · excludes cards</small></article>
      </section>

      <section className="finance-insight-filters" aria-label="Choose insight details">
        <div className="home-type-switch" role="group" aria-label="Choose transaction type"><button type="button" className={type === 'expense' ? 'selected' : ''} aria-pressed={type === 'expense'} onClick={() => setType('expense')}>Expenses</button><button type="button" className={type === 'income' ? 'selected' : ''} aria-pressed={type === 'income'} onClick={() => setType('income')}>Income</button></div>
        <label><span>Category</span><select value={categoryName} onChange={(event) => setCategoryName(event.target.value)}><option value="">All {type === 'expense' ? 'categories' : 'income'}</option>{availableCategories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
        <label><span>Subcategory</span><select value={subcategoryName} onChange={(event) => setSubcategoryName(event.target.value)} disabled={!category || !category.subcategories.length}><option value="">All subcategories</option>{category?.subcategories.map((sub) => <option key={sub} value={sub}>{sub}</option>)}</select></label>
        <div className="insights-selection-total"><span>Selected view · {monthLabel(month, true)}</span><strong>{formatMoney(selectedMonthTotal)}</strong></div>
      </section>

      <div className="finance-insights-grid">
        <article className="insight-panel trend-panel"><header className="insight-panel-heading"><div><span className="insight-panel-icon"><LineChart size={15}/></span><div><h2>{selectedTitle} trend</h2><p>Monthly totals across the last 12 months</p></div></div><span className={`insight-delta ${delta > 0 ? (type === 'expense' ? 'delta-bad' : 'delta-good') : delta < 0 ? (type === 'expense' ? 'delta-good' : 'delta-bad') : ''}`}>{delta > 0 ? <ArrowUpRight size={12}/> : delta < 0 ? <ArrowDownRight size={12}/> : null}{delta === 0 ? 'No change' : `${delta > 0 ? '+' : '−'}${formatMoney(Math.abs(delta))} vs ${changeTitle}`}</span></header>
          {activeSeries.every((point) => point.selected === 0) ? <div className="insight-chart-empty">No matching activity in this period. Add transactions to build your monthly trend.</div> : <div className="insight-line-wrap"><svg viewBox="0 0 620 210" role="img" aria-label={`${selectedTitle} monthly totals line chart`} preserveAspectRatio="none"><title>{selectedTitle} monthly trend</title>{[0, 1, 2, 3].map((line) => <line key={line} x1="0" x2="620" y1={18 + line * 47} y2={18 + line * 47} className="insight-gridline"/>)}{!categoryName && !subcategoryName && <><path d={graphPath(series.map((point) => point.income), lineMax, 620, 178)} className="insight-line income-line"/><path d={graphPath(series.map((point) => point.expense), lineMax, 620, 178)} className="insight-line expense-line"/></>}{(categoryName || subcategoryName) && <path d={graphPath(activeSeries.map((point) => point.selected), lineMax, 620, 178)} className="insight-line selected-line"/>}{activeSeries.map((point, index) => { const values = !categoryName && !subcategoryName ? (type === 'income' ? series.map((row) => row.income) : series.map((row) => row.expense)) : activeSeries.map((row) => row.selected); const x = index * 620 / 11; const y = 178 - values[index] / lineMax * 160; return <g key={point.key}><circle cx={x} cy={y} r={index === 11 ? 4 : 2.4} className={`insight-line-dot ${categoryName || subcategoryName ? 'selected' : type}`}><title>{monthTitle(point.key)}: {formatMoney(values[index])}</title></circle>{index % 2 === 0 && <text x={x} y="204" textAnchor="middle" className="insight-axis-label">{point.label}</text>}</g>; })}</svg><div className="insight-chart-legend">{!categoryName && !subcategoryName ? <><span><i className="income-dot"/> Income</span><span><i className="expense-dot"/> Expenses</span></> : <span><i className="selected-dot"/> {selectedTitle}</span>}</div></div>}
        </article>

        <article className="insight-panel breakdown-panel"><header className="insight-panel-heading"><div><span className="insight-panel-icon"><PieChart size={15}/></span><div><h2>{categoryName ? 'Subcategory breakdown' : `${type === 'expense' ? 'Expense' : 'Income'} breakdown`}</h2><p>{monthTitle(month)} · {selectedRows.length} entries</p></div></div><span className="breakdown-count">{breakdown.length} {categoryName ? 'subcategories' : 'categories'}</span></header>
          {pieRows.length ? <><div className="insight-pie-content"><svg className="insight-pie-chart" viewBox="0 0 200 200" role="img" aria-label="Monthly category breakdown pie chart"><title>{type} category breakdown for {monthTitle(month)}</title>{pieRows.map(([name, value], index) => { const start = pieAngle; pieAngle += value / pieTotal * Math.PI * 2; return <path key={name} d={piePath(start, pieAngle)} fill={categoryChartColors[index % categoryChartColors.length]} stroke="var(--insight-panel)" strokeWidth="2"><title>{name}: {formatMoney(value)} ({Math.round(value / pieTotal * 100)}%)</title></path>; })}</svg><div className="insight-pie-center"><strong>{formatMoney(pieTotal)}</strong><span>{type === 'expense' ? 'spent' : 'received'}</span></div><div className="insight-pie-legend">{pieRows.slice(0, 5).map(([name, value], index) => <div key={name}><i style={{ background: categoryChartColors[index % categoryChartColors.length] }}/><span>{name}</span><b>{Math.round(value / pieTotal * 100)}%</b></div>)}</div></div>
            <div className="insight-breakdown-list"><div className="insight-list-heading"><span>{categoryName ? 'Subcategory' : 'Category'}</span><span>Share</span><span>Amount</span></div>{breakdown.map(([name, value], index) => <div className="insight-breakdown-row" key={name}><span className="insight-breakdown-name"><i style={{ background: categoryChartColors[index % categoryChartColors.length] }}/>{name}</span><span>{pieTotal ? `${(value / pieTotal * 100).toFixed(1)}%` : '0%'}</span><strong>{formatMoney(value)}</strong></div>)}</div>
          </> : <div className="insight-chart-empty">No {type} entries for {monthTitle(month)}. Your breakdown will appear here when transactions are recorded.</div>}
        </article>
      </div>
      <footer className="insights-footer"><span><TrendingUp size={13}/> Savings rate this month: <strong>{income > 0 ? `${savingRate}%` : '—'}</strong></span><button type="button" onClick={onOpenExpense}>Open expense tracker <ChevronRight size={13}/></button></footer>
    </div> : <section className="stocks-insights-empty" role="tabpanel" aria-label="Stock insights"><div className="stocks-empty-icon"><BarChart3 size={23}/></div><span className="home-eyebrow">STOCKS</span><h2>Investment tracking</h2><p>Mutual funds are ready to track here. Other stock tools can be added as your dashboard grows.</p><div className="stocks-empty-preview"><span>Mutual funds</span><span>Portfolio value</span><span>Monthly returns</span></div><button type="button" className="insights-open-funds" onClick={onOpenMutualFunds}>Open Mutual Funds <ChevronRight size={14}/></button></section>}
  </section>;
}
