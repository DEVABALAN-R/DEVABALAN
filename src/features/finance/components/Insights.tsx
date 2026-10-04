import React from 'react';
import { calculateMonthlyTotals, compactMoney, formatMoney, monthDate, monthKey, monthLabel } from '@/features/finance/model/finance';
import { categoryChartColors } from '@/features/finance/model/chartColors';
import type { Account, Category, Transaction } from '@/features/finance/model/types';

type Props = { month: Date; transactions: Transaction[]; accounts: Account[]; categories: Category[]; mode?: 'monthly' | 'yearly' };

export default function Insights({ month, transactions, accounts, categories, mode = 'yearly' }: Props) {
  const [selectedYear, setSelectedYear] = React.useState(month.getFullYear());
  const [pieMonth, setPieMonth] = React.useState(monthKey(month));
  React.useEffect(() => setPieMonth(monthKey(month)), [month]);
  const selectedMonth = mode === 'monthly' ? monthKey(month) : pieMonth;
  const availableYears = [...new Set([new Date().getFullYear(), ...transactions.map((item) => Number(String(item.date || '').slice(0, 4))).filter((year) => year > 1900)])].sort((a, b) => b - a);
  if (!availableYears.includes(selectedYear)) availableYears.unshift(selectedYear);
  const months = mode === 'yearly'
    ? Array.from({ length: 12 }, (_, index) => monthKey(new Date(selectedYear, index, 1)))
    : [monthKey(month)];
  const totals = calculateMonthlyTotals(transactions, months);
  const spend = months.reduce((sum, id) => sum + totals[id].expense, 0);
  const peak = months.map((id) => ({ id, amount: totals[id].expense })).filter((item) => item.amount).sort((a, b) => b.amount - a.amount)[0];
  const categoriesTotal: Record<string, number> = {};
  months.forEach((id) => Object.entries(totals[id].categories).forEach(([name, value]) => categoriesTotal[name] = (categoriesTotal[name] || 0) + Number(value)));
  const ranked = Object.entries(categoriesTotal).sort((a, b) => b[1] - a[1]);
  const pieCategories = mode === 'yearly'
    ? months.reduce<Record<string, number>>((result, id) => { Object.entries(totals[id].categories).forEach(([name, value]) => result[name] = (result[name] || 0) + Number(value)); return result; }, {})
    : totals[selectedMonth]?.categories || {};
  const pieEntries = Object.entries(pieCategories).sort((a, b) => Number(b[1]) - Number(a[1]));
  const pieTotal = pieEntries.reduce((sum, [, amount]) => sum + Number(amount), 0);
  const pieColors = categoryChartColors;
  const categoryColors = ['#111111','#3f3f46','#52525b','#71717a','#85858f','#a1a1aa'];
  const pieChart = (() => {
    const width = 480; const centerX = width / 2; const radius = 100;
    let angle = -Math.PI / 2;
    const wedges = pieEntries.map(([name, value], index) => {
      const startAngle = angle;
      const fraction = pieTotal ? Number(value) / pieTotal : 0;
      angle += fraction * Math.PI * 2;
      const endAngle = angle;
      const midAngle = startAngle + (endAngle - startAngle) / 2;
      const x1 = centerX + Math.cos(startAngle) * radius; const y1 = Math.sin(startAngle) * radius;
      const x2 = centerX + Math.cos(endAngle) * radius; const y2 = Math.sin(endAngle) * radius;
      const fullCircle = fraction >= 0.999999;
      return {
        name, value: Number(value), index, fraction, startAngle, endAngle, midAngle,
        color: pieColors[index % pieColors.length], side: Math.cos(midAngle) >= 0 ? 'right' : 'left', labelY: 0,
        path: fullCircle ? '' : `M ${centerX} 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${fraction > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`,
        x1, y1, x2, y2,
      };
    });
    const sideCounts = ['left', 'right'].map((side) => wedges.filter((item) => item.side === side).length);
    const height = Math.max(260, Math.max(...sideCounts) * 39 + 36);
    const centerY = height / 2;
    const callouts = wedges.map((item) => ({ ...item, desiredY: centerY + Math.sin(item.midAngle) * (radius + 30) }));
    (['left', 'right'] as const).forEach((side) => {
      const group = callouts.filter((item) => item.side === side).sort((a, b) => a.desiredY - b.desiredY);
      const gap = 36; const maxY = height - 18;
      group.forEach((item, index) => { item.labelY = Math.max(item.desiredY, index ? (group[index - 1].labelY || 0) + gap : 18); });
      const overflow = group.length ? (group[group.length - 1].labelY || 0) - maxY : 0;
      if (overflow > 0) group.forEach((item) => { item.labelY = (item.labelY || 0) - overflow; });
    });
    return { width, height, centerX, centerY, radius, callouts };
  })();
  const max = Math.max(1, ...months.flatMap((id) => [totals[id].income, totals[id].expense]));
  const expenseCategories = [...new Set([...categories.filter((item) => item.type === 'expense').map((item) => item.name), ...ranked.map(([name]) => name)])].sort((a, b) => (categoriesTotal[b] || 0) - (categoriesTotal[a] || 0));
  const bankAccounts = accounts.filter((item) => item.type === 'bank');
  const balances = months.map((id) => {
    const cutoff = `${id}-${String(new Date(monthDate(id).getFullYear(), monthDate(id).getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
    let value = bankAccounts.reduce((sum, account) => sum + Number(account.openingBalance || 0), 0);
    transactions.filter((item) => item.date <= cutoff).forEach((item) => {
      const account = bankAccounts.find((entry) => entry.id === item.accountId);
      const amount = Number(item.amount) || 0;
      if (account && item.type === 'income') value += amount;
      if (account && item.type === 'expense') value -= amount;
    });
    return { id, value };
  });
  const svgWidth = Math.max(620, months.length * 72); const svgHeight = 180;
  const min = Math.min(0, ...balances.map((item) => item.value)); const maxBalance = Math.max(min + 1, ...balances.map((item) => item.value));
  const x = (index: number) => 48 + (months.length === 1 ? (svgWidth - 66) / 2 : index * (svgWidth - 66) / (months.length - 1));
  const y = (value: number) => 15 + (maxBalance - value) * 137 / (maxBalance - min);
  const points = balances.map((item, index) => `${x(index)},${y(item.value)}`).join(' ');
  const monthData = mode === 'yearly'
    ? months.reduce((result, id) => { result.income += totals[id].income; result.expense += totals[id].expense; Object.entries(totals[id].categories).forEach(([name, amount]) => result.categories[name] = (result.categories[name] || 0) + Number(amount)); return result; }, { income: 0, expense: 0, categories: {} as Record<string, number> })
    : totals[selectedMonth] || { income: 0, expense: 0 };
  const monthLabelText = mode === 'yearly' ? String(selectedYear) : monthLabel(selectedMonth, true);
  const monthTransactions = transactions.filter((item) => item.date?.startsWith(mode === 'yearly' ? String(selectedYear) : selectedMonth) && ['income', 'expense', 'payment'].includes(item.type));
  const monthTopCategory = Object.entries(monthData.categories || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const monthBankBalance = balances.find((item) => item.id === (mode === 'yearly' ? months[11] : selectedMonth))?.value || 0;
  return <section className="panel analytics-panel" id="insights" aria-labelledby="analyticsTitle">
    <div className="panel-heading analytics-heading"><div><h2 id="analyticsTitle">{mode === 'yearly' ? 'Yearly money insights' : 'Monthly money insights'}</h2><p>{mode === 'yearly' ? `Income, spending, and category trends for ${selectedYear}` : `Category breakdown and totals for ${monthLabel(selectedMonth, true)}`}</p></div>{mode === 'yearly' && <label className="range-control">Year<select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} aria-label="Insights year">{availableYears.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>}</div>
    <div className="analytics-chart-grid insights-pie-grid"><article className="analytics-chart-card monthly-pie-card"><div className="analytics-chart-title"><div><h3>{mode === 'yearly' ? 'Yearly spending by category' : 'Monthly spending by category'}</h3><p>Category share for {monthLabelText} · Total {formatMoney(pieTotal)}</p></div></div>{pieEntries.length ? <><div className="monthly-pie-visual"><svg className="monthly-pie-svg" viewBox={`0 0 ${pieChart.width} ${pieChart.height}`} role="img" aria-label={`${monthLabelText} spending by category. Total ${formatMoney(pieTotal)}.`}><g transform={`translate(0 ${pieChart.centerY})`}>{pieChart.callouts.map((item) => item.fraction >= 0.999999 ? <circle key={item.name} cx={pieChart.centerX} cy="0" r={pieChart.radius} fill={item.color} stroke="#fff" strokeWidth="2"/> : <path key={item.name} d={item.path} fill={item.color} stroke="#fff" strokeWidth="2"/>)}{pieChart.callouts.map((item) => { const sx = pieChart.centerX + Math.cos(item.midAngle) * (pieChart.radius + 1); const sy = Math.sin(item.midAngle) * (pieChart.radius + 1); const endX = item.side === 'right' ? 352 : 128; const textX = item.side === 'right' ? 365 : 115; const anchor = item.side === 'right' ? 'start' : 'end'; const y = (item.labelY || pieChart.centerY) - pieChart.centerY; return <g key={`${item.name}-label`} className="pie-callout"><path d={`M ${sx} ${sy} Q ${(sx + endX) / 2} ${sy} ${endX} ${y} L ${item.side === 'right' ? 359 : 121} ${y}`} fill="none" stroke={item.color} strokeWidth="1.5"/><circle cx={sx} cy={sy} r="2.2" fill={item.color}/><text x={textX} y={y - 3} textAnchor={anchor} className="pie-callout-name">{item.name.length > 17 ? <tspan textLength="108" lengthAdjust="spacingAndGlyphs">{item.name}</tspan> : item.name}</text><text x={textX} y={y + 12} textAnchor={anchor} className="pie-callout-percent">{(item.fraction * 100).toFixed(1)} %</text></g>; })}</g></svg></div><div className="monthly-pie-breakdown" aria-label="Category spending breakdown">{pieChart.callouts.map((item) => <div className="monthly-pie-breakdown-row" key={item.name}><span className="pie-percent-badge" style={{ '--slice-color': item.color } as React.CSSProperties}>{Math.round(item.fraction * 100)}%</span><span className="pie-breakdown-name">{item.name}</span><strong>{formatMoney(item.value)}</strong></div>)}</div></> : <div className="monthly-pie-empty">No expenses recorded for {monthLabelText}.</div>}</article></div>
    {mode === 'yearly' && <section className="monthly-focus-section" aria-label={`${monthLabelText} details`}><div className="monthly-focus-heading"><h3>{monthLabelText} at a glance</h3><span>{monthTransactions.length} entries</span></div><div className="monthly-focus-grid"><article className="monthly-focus-metric"><span>YEAR INCOME</span><strong>{formatMoney(monthData.income)}</strong></article><article className="monthly-focus-metric"><span>YEAR SPENDING</span><strong>{formatMoney(monthData.expense)}</strong></article><article className="monthly-focus-metric"><span>BANK CLOSING BALANCE</span><strong>{formatMoney(monthBankBalance)}</strong></article><article className="monthly-focus-metric"><span>TOP CATEGORY</span><strong>{monthTopCategory?.[0] || '—'}</strong><small>{monthTopCategory ? formatMoney(monthTopCategory[1]) : 'No category data'}</small></article></div></section>}
    {mode === 'yearly' && <div className="analytics-metrics"><article className="analytics-metric"><span>AVERAGE MONTHLY SPEND</span><strong>{formatMoney(spend / months.length)}</strong><small>Across {months.length} months · {formatMoney(spend)} total</small></article><article className="analytics-metric"><span>HIGHEST SPEND MONTH</span><strong>{peak ? formatMoney(peak.amount) : '—'}</strong><small>{peak ? monthLabel(peak.id, true) : 'No spending recorded'}</small></article><article className="analytics-metric"><span>TOP SPENDING CATEGORY</span><strong>{ranked[0]?.[0] || '—'}</strong><small>{ranked[0] ? `${formatMoney(ranked[0][1])} across selected year` : 'No category data yet'}</small></article></div>}
    {mode === 'yearly' && <div className="analytics-chart-grid"><article className="analytics-chart-card"><div className="analytics-chart-title"><div><h3>Income vs. spending</h3><p>Monthly totals in rupees</p></div><div className="analytics-legend"><span><i className="legend-income"/>Income</span><span><i className="legend-spent"/>Spent</span></div></div><div className="monthly-bars" role="img" aria-label="Monthly income and spending comparison">{months.map((id) => <div className="month-bar-column" key={id} title={`${monthLabel(id, true)} · Income ${formatMoney(totals[id].income)} · Spent ${formatMoney(totals[id].expense)}`}><div className="month-bar-values"><span>{totals[id].income ? compactMoney.format(totals[id].income) : ''}</span><span>{totals[id].expense ? compactMoney.format(totals[id].expense) : ''}</span></div><div className="month-bar-track"><i className="month-income-bar" style={{ height: `${totals[id].income ? Math.max(2, totals[id].income / max * 100) : 0}%` }}/><i className="month-expense-bar" style={{ height: `${totals[id].expense ? Math.max(2, totals[id].expense / max * 100) : 0}%` }}/></div><small>{monthLabel(id, true)}</small></div>)}</div></article>
      
      <article className="analytics-chart-card"><div className="analytics-chart-title"><div><h3>Category mix by month</h3><p>Share of expense by category</p></div></div><div className="category-month-chart">{months.map((id) => <div className="category-month-column" key={id}><div className="category-stack-track">{ranked.map(([name], index) => totals[id].categories[name] ? <i key={name} style={{ height: `${totals[id].categories[name] / (totals[id].expense || 1) * 100}%`, background: categoryColors[index % categoryColors.length] }} title={`${name}: ${formatMoney(totals[id].categories[name])}`}/> : null)}</div><small>{monthLabel(id, true)}</small></div>)}</div><div className="category-chart-legend">{ranked.length ? ranked.map(([name], index) => <span key={name}><i style={{ background: categoryColors[index % categoryColors.length] }}/>{name}</span>) : <span className="analytics-empty-note">Category data will appear when expenses are recorded.</span>}</div></article></div>}
    {mode === 'yearly' && <article className="analytics-chart-card balance-trend-card"><div className="analytics-chart-title"><div><h3>Bank balance over time</h3><p>Cumulative bank cash balance, excluding credit card balances</p></div></div>{bankAccounts.length ? <div className="balance-line-chart"><svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" role="img" aria-label="Bank balance trend by month"><polyline points={points} className="balance-line" fill="none"/>{balances.map((item, index) => <g key={item.id}><circle cx={x(index)} cy={y(item.value)} r="3.5" className="balance-point"><title>{monthLabel(item.id, true)}: {formatMoney(item.value)}</title></circle><text x={x(index)} y="173" textAnchor="middle" className="balance-axis-label">{monthLabel(item.id, true)}</text></g>)}</svg></div> : <div className="analytics-empty">Add a bank account to see your cumulative bank balance trend.</div>}</article>}
    {mode === 'yearly' && <article className="category-table-card"><div className="analytics-chart-title"><div><h3>Category &amp; subcategory comparison</h3><p>Amounts for each month in the selected range</p></div></div><div className="category-table-wrap">{expenseCategories.length ? <table className="monthly-category-table"><thead><tr><th>Category / subcategory</th>{months.map((id) => <th key={id}>{monthLabel(id, true)}</th>)}<th>Total</th></tr></thead><tbody>{expenseCategories.map((name) => { const subs = new Set([...categories.find((item) => item.name === name)?.subcategories || [], ...transactions.filter((item) => item.type === 'expense' && item.category === name && item.subcategory && months.includes(item.date?.slice(0, 7))).map((item) => item.subcategory)]); const total = categoriesTotal[name] || 0; return <React.Fragment key={name}><tr className="category-total-row"><th>{name}</th>{months.map((id) => <td key={id} data-label={monthLabel(id, true)}>{totals[id].categories[name] ? formatMoney(totals[id].categories[name]) : '—'}</td>)}<td className="table-grand-total" data-label="Total">{formatMoney(total)}</td></tr>{[...subs].map((sub) => { const subTotal = months.reduce((sum, id) => sum + (totals[id].subcategories[`${name}::${sub}`] || 0), 0); return <tr className="subcategory-row" key={`${name}-${sub}`}><th><span>↳</span>{sub}</th>{months.map((id) => <td key={id} data-label={monthLabel(id, true)}>{totals[id].subcategories[`${name}::${sub}`] ? formatMoney(totals[id].subcategories[`${name}::${sub}`]) : '—'}</td>)}<td className="table-grand-total" data-label="Total">{formatMoney(subTotal)}</td></tr>; })}</React.Fragment>; })}</tbody></table> : <div className="analytics-empty">Add expense categories and transactions to compare monthly spending.</div>}</div></article>}
  </section>;
}
