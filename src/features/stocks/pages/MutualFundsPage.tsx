import React from 'react';
import { ChevronDown, CirclePlus, FilePlus2, LineChart, Pencil, PieChart, Plus, Search, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { dateKey, formatMoney, monthKey, monthDate } from '@/features/finance/model/finance';
import { categoryChartColors } from '@/features/finance/model/chartColors';
import { calculateNetSpent, calculateUnitsAllotted, currentFundTotals, type FundPurchase, type MutualFund } from '@/features/stocks/model/mutualFunds';
import '@/shared/styles/mutual-funds.css';

type Props = { funds: MutualFund[]; purchases: FundPurchase[]; onSaveFund: (value: MutualFund) => void; onRemoveFund: (id: string) => void; onSavePurchase: (value: FundPurchase) => void; onRemovePurchase: (id: string) => void };
type FundForm = { fund: MutualFund | null; onSave: (value: MutualFund) => void; onClose: () => void };
type PurchaseForm = { funds: MutualFund[]; purchase: FundPurchase | null; fundId: string; onSave: (value: FundPurchase) => void; onClose: () => void };
const today = () => dateKey(new Date());
const displayDate = (value: string) => { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}`; };
const uid = () => crypto.randomUUID();
const percent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
const compactRupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 });
const num = (data: FormData, key: string) => Number(data.get(key) || 0);

function FundEditor({ fund, onSave, onClose }: FundForm) {
  return <div className="mf-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="mf-modal" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get('name') || '').trim(); const category = String(data.get('category') || '').trim(); const nav = num(data, 'currentNav'); if (!name || !category || nav <= 0) return; const date = today(); const previous = fund?.navHistory || []; const navHistory = previous.length && previous.at(-1)?.date === date ? [...previous.slice(0, -1), { date, nav }] : [...previous, { date, nav }]; onSave({ id: fund?.id || uid(), name, category, folioNumber: String(data.get('folioNumber') || '').trim(), expenseRatio: String(data.get('expenseRatio') || '').trim() ? num(data, 'expenseRatio') : null, exitLoad: String(data.get('exitLoad') || '').trim(), minimumInvestment: String(data.get('minimumInvestment') || '').trim() ? num(data, 'minimumInvestment') : null, defaultStampDuty: String(data.get('defaultStampDuty') || '').trim() ? num(data, 'defaultStampDuty') : null, currentNav: nav, navHistory, createdAt: fund?.createdAt || Date.now() }); }}>
    <header><div><span className="mf-eyebrow">FUND DETAILS</span><h2>{fund ? 'Edit mutual fund' : 'Add a mutual fund'}</h2><p>Enter the fund details and latest NAV from your statement.</p></div><button type="button" className="mf-icon-button" aria-label="Close form" onClick={onClose}><X size={17}/></button></header>
    <div className="mf-form-grid"><label className="span-all">Fund name<input name="name" required maxLength={120} defaultValue={fund?.name} placeholder="e.g. Fund name from your statement"/></label><label>Category<input name="category" required maxLength={50} defaultValue={fund?.category} placeholder="e.g. Large Cap"/></label><label>Folio number <small>Optional</small><input name="folioNumber" maxLength={40} defaultValue={fund?.folioNumber} placeholder="Enter folio number"/></label><label>Current NAV<input name="currentNav" required type="number" min="0.0001" step="0.0001" defaultValue={fund?.currentNav || ''} placeholder="0.00"/></label><label>Expense ratio (%) <small>Optional</small><input name="expenseRatio" type="number" min="0" step="0.01" defaultValue={fund?.expenseRatio ?? ''} placeholder="e.g. 0.65"/></label><label>Minimum investment <small>Optional</small><input name="minimumInvestment" type="number" min="0" step="0.01" defaultValue={fund?.minimumInvestment ?? ""} placeholder="e.g. 500"/></label><label>Typical stamp duty <small>Optional</small><input name="defaultStampDuty" type="number" min="0" step="0.01" defaultValue={fund?.defaultStampDuty ?? ""} placeholder="e.g. 0.03"/></label><label className="span-all">Exit load <small>Optional</small><input name="exitLoad" maxLength={40} defaultValue={fund?.exitLoad} placeholder="e.g. 1% within 1 year"/></label></div>
    <footer><button type="button" className="mf-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="mf-primary-button">{fund ? 'Save fund' : 'Add fund'}</button></footer>
  </form></div>;
}

function PurchaseEditor({ funds, purchase, fundId, onSave, onClose }: PurchaseForm) {
  const [invested, setInvested] = React.useState(purchase?.investedAmount ? String(purchase.investedAmount) : '');
  const [duty, setDuty] = React.useState(purchase ? String(purchase.stampDuty) : '0');
  const [nav, setNav] = React.useState(purchase?.purchasedNav ? String(purchase.purchasedNav) : '');
  const net = calculateNetSpent(Number(invested), Number(duty));
  const units = calculateUnitsAllotted(net, Number(nav));
  return <div className="mf-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><form className="mf-modal" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const gross = num(data, 'investedAmount'); const stampDuty = num(data, 'stampDuty'); const purchasedNav = num(data, 'purchasedNav'); if (gross <= 0 || stampDuty < 0 || stampDuty > gross || purchasedNav <= 0) return; const purchasedDate = String(data.get('purchasedDate') || ''); const executionDate = String(data.get('executionDate') || ''); const canonicalDate = purchasedDate === executionDate ? purchasedDate : `${purchasedDate.slice(0, 7)}-01`; onSave({ id: purchase?.id || uid(), fundId: String(data.get('fundId') || ''), purchasedDate: canonicalDate, executionDate: canonicalDate, investedAmount: gross, stampDuty, purchasedNav, units: calculateUnitsAllotted(calculateNetSpent(gross, stampDuty), purchasedNav) }); }}>
    <header><div><span className="mf-eyebrow">INVESTMENT ENTRY</span><h2>{purchase ? 'Edit purchase' : 'Record an investment'}</h2><p>Units and net amount calculate automatically. Different dates are aligned to the first of the purchase month.</p></div><button type="button" className="mf-icon-button" aria-label="Close form" onClick={onClose}><X size={17}/></button></header>
    <div className="mf-form-grid"><label className="span-all">Mutual fund<select name="fundId" required defaultValue={purchase?.fundId || fundId || ''} disabled={Boolean(purchase)}><option value="">Choose a fund</option>{funds.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Purchased date<input name="purchasedDate" type="date" required defaultValue={purchase?.purchasedDate || today()}/></label><label>Execution date<input name="executionDate" type="date" required defaultValue={purchase?.executionDate || today()}/></label><label>Invested amount<input name="investedAmount" type="number" min="0.01" step="0.01" required value={invested} onChange={(event) => setInvested(event.target.value)} placeholder="₹ 0.00"/></label><label>Stamp duty<input name="stampDuty" type="number" min="0" step="0.01" value={duty} onChange={(event) => setDuty(event.target.value)} placeholder="₹ 0.00"/></label><label>Purchase NAV<input name="purchasedNav" type="number" min="0.0001" step="0.0001" required value={nav} onChange={(event) => setNav(event.target.value)} placeholder="0.00"/></label><div className="mf-calculation-preview"><span>Net amount <strong>{formatMoney(net)}</strong></span><span>Units allotted <strong>{units.toFixed(6)}</strong></span></div></div>
    <footer><button type="button" className="mf-secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="mf-primary-button">{purchase ? 'Save changes' : 'Save investment'}</button></footer>
  </form></div>;
}

function navCheckpoint(fund: MutualFund, nav: number, date: string): MutualFund {
  const navHistory = [...fund.navHistory.filter((point) => point.date !== date), { date, nav }].sort((a, b) => a.date.localeCompare(b.date));
  return { ...fund, currentNav: nav, navHistory };
}

type MutualFundsTab = 'overview' | 'funds' | 'purchases';

export default function MutualFundsPage({ funds, purchases, onSaveFund, onRemoveFund, onSavePurchase, onRemovePurchase }: Props) {
  const [fundEditor, setFundEditor] = React.useState<MutualFund | null | undefined>(undefined);
  const [purchaseEditor, setPurchaseEditor] = React.useState<{ purchase: FundPurchase | null; fundId: string } | null>(null);
  const [tab, setTab] = React.useState<MutualFundsTab>('overview');
  const [chartFundId, setChartFundId] = React.useState('');
  const [activeChartMonth, setActiveChartMonth] = React.useState<string | null>(null);
  const [timeRange, setTimeRange] = React.useState<'6M' | '1Y' | 'ALL'>('1Y');
  const [query, setQuery] = React.useState('');
  const [purchaseFundFilter, setPurchaseFundFilter] = React.useState('all');
  const [sortNewest, setSortNewest] = React.useState(true);
  const [navDrafts, setNavDrafts] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState('');
  const totals = funds.map((fund) => ({ fund, ...currentFundTotals(fund, purchases) }));
  const invested = totals.reduce((sum, item) => sum + item.netSpent, 0);
  const grossInvested = totals.reduce((sum, item) => sum + item.invested, 0);
  const value = totals.reduce((sum, item) => sum + item.marketValue, 0);
  const pnl = value - invested;
  const roi = invested > 0 ? pnl / invested * 100 : 0;
  const categories = [...new Set(funds.map((fund) => fund.category))];
  const categoryTotals = categories.map((name) => {
    const rows = totals.filter((item) => item.fund.category === name);
    const principal = rows.reduce((sum, item) => sum + item.netSpent, 0);
    const current = rows.reduce((sum, item) => sum + item.marketValue, 0);
    const change = current - principal;
    return { name, principal, current, change, roi: principal ? change / principal * 100 : 0 };
  });
  const chartFund = funds.find((fund) => fund.id === chartFundId) || funds[0];
  const fundPurchases = chartFund
    ? purchases.filter((purchase) => purchase.fundId === chartFund.id)
      .sort((a, b) => a.purchasedDate.localeCompare(b.purchasedDate) || a.id.localeCompare(b.id))
    : [];
  const purchasesPerMonth = fundPurchases.reduce<Record<string, number>>((counts, purchase) => {
    const month = purchase.purchasedDate.slice(0, 7);
    counts[month] = (counts[month] || 0) + 1;
    return counts;
  }, {});
  const seenPerMonth: Record<string, number> = {};
  const allChartPoints = fundPurchases.map((purchase) => {
    const month = purchase.purchasedDate.slice(0, 7);
    const monthIndex = seenPerMonth[month] || 0;
    seenPerMonth[month] = monthIndex + 1;
    const monthCount = purchasesPerMonth[month];
    return {
      id: purchase.id,
      month,
      nav: purchase.purchasedNav,
      invested: purchase.investedAmount,
      units: purchase.units,
      date: purchase.purchasedDate,
      monthOffset: (monthIndex - (monthCount - 1) / 2) * 7,
    };
  });
  const rangeStart = monthDate(monthKey(new Date()));
  rangeStart.setMonth(rangeStart.getMonth() - (timeRange === '6M' ? 5 : 11));
  const chartPoints = timeRange === 'ALL' ? allChartPoints : allChartPoints.filter((point) => monthDate(point.month) >= rangeStart);
  const activeChartPoint = chartPoints.find((point) => point.id === activeChartMonth) || chartPoints.at(-1);
  const rawMin = chartPoints.length ? Math.min(...chartPoints.map((point) => point.nav)) : 0;
  const rawMax = chartPoints.length ? Math.max(...chartPoints.map((point) => point.nav)) : 1;
  const chartPadding = Math.max((rawMax - rawMin) * 0.12, rawMax * 0.015, 0.01);
  const chartMin = Math.max(0, rawMin - chartPadding);
  const chartMax = rawMax + chartPadding;
  const chartSpan = Math.max(1, chartMax - chartMin);
  const chartY = (nav: number) => 180 - ((nav - chartMin) / chartSpan) * 142;
  const firstChartDate = chartPoints.length ? monthDate(chartPoints[0].month).getTime() : 0;
  const lastChartDate = chartPoints.length ? monthDate(chartPoints.at(-1)!.month).getTime() : 0;
  const chartX = (point: { month: string; monthOffset?: number }) => 48 + ((monthDate(point.month).getTime() - firstChartDate) / Math.max(1, lastChartDate - firstChartDate)) * 688 + (point.monthOffset || 0);
  const chartPath = chartPoints.map((point, index) => `${index ? 'L' : 'M'} ${chartX(point)} ${chartY(point.nav)}`).join(' ');
  const visiblePurchases = purchases.filter((item) => {
    const fund = funds.find((entry) => entry.id === item.fundId);
    const matchesFund = purchaseFundFilter === 'all' || item.fundId === purchaseFundFilter;
    const text = `${fund?.name || ''} ${item.purchasedDate} ${item.executionDate} ${item.investedAmount} ${item.purchasedNav}`.toLocaleLowerCase();
    return matchesFund && (!query || text.includes(query.toLocaleLowerCase()));
  }).sort((a, b) => sortNewest ? b.executionDate.localeCompare(a.executionDate) : a.executionDate.localeCompare(b.executionDate));

  React.useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 2600); return () => window.clearTimeout(timer); }, [notice]);
  React.useEffect(() => { setNavDrafts(Object.fromEntries(funds.map((fund) => [fund.id, String(fund.currentNav)]))); }, [funds]);

  function removeFund(fund: MutualFund) {
    const count = purchases.filter((item) => item.fundId === fund.id).length;
    if (!window.confirm(`Delete “${fund.name}” and its ${count} purchase entries?`)) return;
    onRemoveFund(fund.id);
    setNotice('Fund and its purchases deleted.');
  }
  function saveFund(fund: MutualFund) { onSaveFund(fund); setFundEditor(undefined); setNotice('Fund details saved.'); }
  function savePurchase(purchase: FundPurchase) { onSavePurchase(purchase); setPurchaseEditor(null); setNotice('Purchase saved.'); }
  function saveAllNavs() {
    const date = today();
    if (funds.some((fund) => !Number.isFinite(Number(navDrafts[fund.id])) || Number(navDrafts[fund.id]) <= 0)) {
      setNotice('Enter a valid NAV greater than zero for every fund.');
      return;
    }
    const changed = funds.filter((fund) => Number(navDrafts[fund.id]) !== fund.currentNav);
    if (!changed.length) { setNotice('All NAVs are already up to date.'); return; }
    changed.forEach((fund) => onSaveFund(navCheckpoint(fund, Number(navDrafts[fund.id]), date)));
    setNotice(`${changed.length} NAV ${changed.length === 1 ? 'update' : 'updates'} saved. Portfolio values refreshed.`);
  }

  const navTabs: { id: MutualFundsTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'funds', label: 'Funds', count: funds.length },
    { id: 'purchases', label: 'Purchases', count: purchases.length },
  ];

  return <main className="mutual-funds-page mf-tabbed-page">
    <header className="mf-page-header"><div><span className="mf-eyebrow">STOCKS · INVESTMENTS</span><h1>Mutual funds</h1><p>Portfolio value, returns and purchase history.</p></div><div className="mf-header-actions"><button className="mf-secondary-button" type="button" disabled={!funds.length} onClick={() => setTab('funds')}><TrendingUp size={14}/> Update NAVs</button><button className="mf-secondary-button" type="button" disabled={!funds.length} onClick={() => { setTab('purchases'); setPurchaseFundFilter('all'); setPurchaseEditor({ purchase: null, fundId: '' }); }}><FilePlus2 size={14}/> Record purchase</button><button className="mf-primary-button" type="button" onClick={() => setFundEditor(null)}><Plus size={15}/> Add fund</button></div></header>

    <section className="mf-summary-grid" aria-label="Portfolio summary"><article className="mf-summary-card invested"><span>Net invested</span><strong>{formatMoney(invested)}</strong><small>{formatMoney(grossInvested)} gross · {purchases.length} purchases</small></article><article className={`mf-summary-card returns ${pnl >= 0 ? 'positive' : 'negative'}`}><span>Profit / loss</span><strong>{pnl >= 0 ? '+' : '−'}{formatMoney(Math.abs(pnl))}</strong><small><i>{pnl >= 0 ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}</i>{percent(roi)} overall return</small></article><article className="mf-summary-card current"><span>Current value</span><strong>{formatMoney(value)}</strong><small>{funds.length} {funds.length === 1 ? 'fund' : 'funds'} · Updated NAV by fund</small></article></section>

    <nav className="mf-tabs" aria-label="Mutual fund sections">{navTabs.map((item) => <button type="button" key={item.id} aria-current={tab === item.id ? 'page' : undefined} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>{item.label}{item.count !== undefined && <span>{item.count}</span>}</button>)}</nav>

    {tab === 'overview' && <section className="mf-tab-content mf-overview-grid">
      <article className="mf-section mf-overview-chart"><header className="mf-section-heading"><div><h2>{chartFund ? chartFund.name : 'Purchase NAV by month'}</h2><p>NAV recorded for each purchase. Every installment is shown.</p></div><div className="mf-chart-controls"><select aria-label="Choose a fund to chart" value={chartFund?.id || ''} onChange={(event) => { setChartFundId(event.target.value); setActiveChartMonth(null); }}><option value="" disabled>Choose a fund</option>{funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select><div className="mf-range-tabs">{(['6M', '1Y', 'ALL'] as const).map((range) => <button key={range} type="button" className={timeRange === range ? 'selected' : ''} aria-pressed={timeRange === range} onClick={() => setTimeRange(range)}>{range}</button>)}</div></div></header>
        {!chartFund || !chartPoints.length ? <div className="mf-chart-empty"><LineChart size={21}/><div><b>No purchases for this fund in this period.</b><small>Choose another range or record a purchase for the selected fund.</small></div></div> : <div className="mf-chart-area mf-line-chart"><svg viewBox="0 0 760 220" role="img" aria-label={`${chartFund.name} monthly purchase NAV`} preserveAspectRatio="none"><title>{chartFund.name} monthly purchase NAV. Focus or point to a dot to read its NAV and monthly investment.</title>{[0, 1, 2, 3].map((row) => <line key={row} x1="52" x2="746" y1={38 + row * 39} y2={38 + row * 39} className="mf-chart-gridline"/>)}<text x="2" y="42" className="mf-chart-axis-label">{compactRupees.format(chartMax - chartPadding)}</text><text x="2" y="188" className="mf-chart-axis-label">{compactRupees.format(chartMin)}</text>{chartPoints.length > 1 && <path d={chartPath} className="mf-chart-line mf-chart-line-value"/>}{chartPoints.map((point) => { const x = chartX(point); const dateLabel = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(point.date + "T12:00:00")); return <circle key={point.id} cx={x} cy={chartY(point.nav)} r="4.5" className="mf-chart-point" role="button" tabIndex={0} aria-label={`${dateLabel}, purchase NAV ₹${point.nav.toFixed(4)}, invested ${formatMoney(point.invested)}`} onPointerEnter={() => setActiveChartMonth(point.id)} onFocus={() => setActiveChartMonth(point.id)}><title>{dateLabel} · Purchase NAV ₹{point.nav.toFixed(4)} · Invested {formatMoney(point.invested)} · Units {point.units.toFixed(3)}</title></circle>; })}{chartPoints.map((point, index) => { const showValue = index === 0 || index === chartPoints.length - 1 || index % Math.max(1, Math.ceil(chartPoints.length / 8)) === 0 || point.id === activeChartPoint?.id; if (!showValue) return null; const x = chartX(point); const isLast = index === chartPoints.length - 1; return <text key={`nav-${point.id}`} x={x + (isLast ? -6 : 6)} y={chartY(point.nav) - 9} textAnchor={isLast ? "end" : "start"} className="mf-chart-value-label">{point.nav.toFixed(2)}</text>; })}{chartPoints.map((point, index) => (point.month !== chartPoints[index - 1]?.month && (index === 0 || index === chartPoints.length - 1 || index % Math.max(1, Math.ceil(chartPoints.length / 6)) === 0)) && <text key={point.month} x={chartX(point)} y="214" textAnchor={index === 0 ? 'start' : index === chartPoints.length - 1 ? 'end' : 'middle'} className="mf-chart-label">{new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(monthDate(point.month))}</text>)}</svg><div className="mf-chart-legend mf-chart-legend-persistent"><span><i className="mf-legend-value"/>Purchase NAV</span></div><div className="mf-chart-readout" aria-live="polite"><span>{activeChartPoint ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(activeChartPoint.date + "T12:00:00")) : 'Latest purchase'}</span><div><small>Purchase NAV</small><strong>{activeChartPoint ? `₹${activeChartPoint.nav.toFixed(4)}` : '—'}</strong></div><div><small>Invested that month</small><strong>{formatMoney(activeChartPoint?.invested || 0)}</strong></div><div><small>Units allotted</small><strong>{activeChartPoint?.units.toFixed(3) || '—'}</strong></div></div></div>}
      </article>
      <article className="mf-section mf-overview-holdings"><header className="mf-section-heading"><div><h2>Fund performance</h2><p>Current NAV and returns by fund.</p></div><button className="mf-text-button" type="button" onClick={() => setTab('funds')}>Manage funds <ChevronDown size={13}/></button></header>{totals.length ? <div className="mf-overview-fund-list">{totals.map((item, index) => <button type="button" key={item.fund.id} className="mf-overview-fund" onClick={() => { setChartFundId(item.fund.id); }}><i style={{ background: categoryChartColors[index % categoryChartColors.length] }}/><span><b>{item.fund.name}</b><small>{item.fund.category} · NAV ₹{item.fund.currentNav.toFixed(4)}</small></span><strong>{formatMoney(item.marketValue)}<small className={item.profitLoss >= 0 ? 'positive' : 'negative'}>{item.profitLoss >= 0 ? '+' : '−'}{formatMoney(Math.abs(item.profitLoss))} · {percent(item.roi)}</small></strong></button>)}</div> : <div className="mf-empty-inline"><span><CirclePlus size={16}/></span><div><b>No funds yet</b><small>Add a fund to start tracking NAV and performance.</small></div><button type="button" onClick={() => setFundEditor(null)}>Add fund</button></div>}
        {!!categoryTotals.length && <div className="mf-category-summary">{categoryTotals.map((item, index) => <div key={item.name}><i style={{ background: categoryChartColors[index % categoryChartColors.length] }}/><span>{item.name}</span><b className={item.change >= 0 ? 'positive' : 'negative'}>{item.change >= 0 ? '+' : '−'}{formatMoney(Math.abs(item.change))}</b></div>)}</div>}
      </article>
    </section>}

    {tab === 'funds' && <section className="mf-tab-content mf-section mf-funds-tab"><header className="mf-section-heading"><div><h2>Funds & current NAV</h2><p>Enter NAVs from your latest statement. Each saved value is recorded with today’s date.</p></div><button type="button" className="mf-primary-button" disabled={!funds.length} onClick={saveAllNavs}><TrendingUp size={14}/> Save NAV updates</button></header>{funds.length ? <div className="mf-funds-table-wrap"><table className="mf-funds-table"><thead><tr><th>Fund</th><th>Folio</th><th>Units</th><th>Net invested</th><th>Current NAV</th><th>Current value</th><th>Gain / loss</th><th>Actions</th></tr></thead><tbody>{totals.map((item, index) => <tr key={item.fund.id}><td><span className="mf-table-fund"><i style={{ background: categoryChartColors[index % categoryChartColors.length] }}/><span><b>{item.fund.name}</b><small>{item.fund.category}</small></span></span></td><td>{item.fund.folioNumber || '—'}</td><td>{item.units.toFixed(3)}</td><td>{formatMoney(item.netSpent)}</td><td><label className="mf-nav-field"><span>₹</span><input aria-label={`Current NAV for ${item.fund.name}`} type="number" min="0.0001" step="0.0001" value={navDrafts[item.fund.id] ?? String(item.fund.currentNav)} onChange={(event) => setNavDrafts((old) => ({ ...old, [item.fund.id]: event.target.value }))}/></label></td><td><b>{formatMoney(item.marketValue)}</b></td><td className={item.profitLoss >= 0 ? 'positive' : 'negative'}>{item.profitLoss >= 0 ? '+' : '−'}{formatMoney(Math.abs(item.profitLoss))} <small>{percent(item.roi)}</small></td><td><span className="mf-table-actions"><button type="button" aria-label={`Edit ${item.fund.name}`} onClick={() => setFundEditor(item.fund)}><Pencil size={13}/></button><button type="button" aria-label={`Record purchase for ${item.fund.name}`} onClick={() => setPurchaseEditor({ purchase: null, fundId: item.fund.id })}><Plus size={14}/></button><button type="button" aria-label={`Delete ${item.fund.name}`} onClick={() => removeFund(item.fund)}><Trash2 size={13}/></button></span></td></tr>)}</tbody></table></div> : <div className="mf-empty-state"><span><PieChart size={21}/></span><h2>No mutual funds added</h2><p>Add a fund to begin tracking investments and NAV updates.</p><button className="mf-primary-button" type="button" onClick={() => setFundEditor(null)}><Plus size={14}/> Add fund</button></div>}</section>}

    {tab === 'purchases' && <section className="mf-tab-content mf-section mf-purchases-tab"><header className="mf-section-heading"><div><h2>Purchase history</h2><p>{visiblePurchases.length} entries · net amounts and allotted units</p></div><button className="mf-primary-button" type="button" disabled={!funds.length} onClick={() => setPurchaseEditor({ purchase: null, fundId: purchaseFundFilter === 'all' ? '' : purchaseFundFilter })}><Plus size={14}/> Add purchase</button></header><div className="mf-purchase-tools"><label className="mf-search-field"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fund or purchase" aria-label="Search purchases"/></label><select value={purchaseFundFilter} aria-label="Filter purchases by fund" onChange={(event) => setPurchaseFundFilter(event.target.value)}><option value="all">All funds</option>{funds.map((fund) => <option key={fund.id} value={fund.id}>{fund.name}</option>)}</select><button type="button" className="mf-secondary-button" onClick={() => setSortNewest((value) => !value)}>{sortNewest ? 'Newest first' : 'Oldest first'}</button></div><div className="mf-purchases-table-wrap"><table className="mf-purchases-table"><thead><tr><th>Fund</th><th>Purchased</th><th>Executed</th><th>Invested</th><th>Net spent</th><th>Stamp duty</th><th>Purchase NAV</th><th>Units</th><th>Actions</th></tr></thead><tbody>{visiblePurchases.map((entry) => <tr key={entry.id}><td>{funds.find((fund) => fund.id === entry.fundId)?.name || 'Unknown fund'}</td><td>{displayDate(entry.purchasedDate)}</td><td>{displayDate(entry.executionDate)}</td><td>{formatMoney(entry.investedAmount)}</td><td>{formatMoney(calculateNetSpent(entry.investedAmount, entry.stampDuty))}</td><td>{formatMoney(entry.stampDuty)}</td><td>₹{entry.purchasedNav.toFixed(4)}</td><td>{entry.units.toFixed(3)}</td><td><span className="mf-table-actions"><button type="button" aria-label="Edit purchase" onClick={() => setPurchaseEditor({ purchase: entry, fundId: entry.fundId })}><Pencil size={13}/></button><button type="button" aria-label="Delete purchase" onClick={() => { if (window.confirm('Delete this purchase?')) { onRemovePurchase(entry.id); setNotice('Purchase deleted.'); } }}><Trash2 size={13}/></button></span></td></tr>)}</tbody></table>{!visiblePurchases.length && <div className="mf-table-empty">No purchases match these filters.</div>}</div></section>}

    {fundEditor !== undefined && <FundEditor fund={fundEditor} onSave={saveFund} onClose={() => setFundEditor(undefined)}/>}{purchaseEditor && <PurchaseEditor funds={funds} purchase={purchaseEditor.purchase} fundId={purchaseEditor.fundId} onSave={savePurchase} onClose={() => setPurchaseEditor(null)}/>}{notice && <div className="mf-toast" role="status">{notice}</div>}
  </main>;
}
