export type NavSnapshot = { date: string; nav: number };
export type MutualFund = {
  id: string;
  name: string;
  category: string;
  folioNumber: string;
  expenseRatio: number | null;
  exitLoad: string;
  minimumInvestment?: number | null;
  defaultStampDuty?: number | null;
  currentNav: number;
  navHistory: NavSnapshot[];
  createdAt: number;
};
export type FundPurchase = {
  id: string;
  fundId: string;
  purchasedDate: string;
  executionDate: string;
  investedAmount: number;
  stampDuty: number;
  purchasedNav: number;
  units: number;
};

const validDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T12:00:00`).getTime()) && new Date(`${value}T12:00:00`).toISOString().slice(0, 10) === value;
const finitePositive = (value: unknown): number | null => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; };

export function calculateNetSpent(invested: number, stampDuty: number): number {
  return Math.max(0, Number(invested || 0) - Number(stampDuty || 0));
}
export function calculateUnitsAllotted(netSpent: number, nav: number): number {
  // The statement ledger records units to three decimal places per allotment.
  return nav > 0 ? Math.round((netSpent / nav) * 1_000) / 1_000 : 0;
}
export function calculateAverageNAV(totalNetSpent: number, totalUnits: number): number {
  return totalUnits > 0 ? totalNetSpent / totalUnits : 0;
}
export function calculateCurrentMarketValue(totalUnits: number, currentNAV: number): number {
  return totalUnits * currentNAV;
}
export function calculateProfitLoss(currentValue: number, totalInvested: number): number {
  return currentValue - totalInvested;
}
export function calculateReturnsPercentage(profitLoss: number, totalInvested: number): number {
  return totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
}

export function normalizeMutualFund(value: unknown): MutualFund | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<MutualFund>;
  const currentNav = finitePositive(item.currentNav);
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name.trim() || !currentNav) return null;
  const navHistory = Array.isArray(item.navHistory) ? item.navHistory.flatMap((point) => {
    const nav = finitePositive(point?.nav);
    return nav && validDate(point?.date) ? [{ date: point.date, nav }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date)) : [];
  return {
    id: item.id,
    name: item.name.trim().slice(0, 120),
    category: typeof item.category === 'string' && item.category.trim() ? item.category.trim().slice(0, 50) : 'Unclassified',
    folioNumber: typeof item.folioNumber === 'string' ? item.folioNumber.trim().slice(0, 40) : '',
    expenseRatio: item.expenseRatio == null || String(item.expenseRatio).trim() === '' ? null : Number.isFinite(Number(item.expenseRatio)) && Number(item.expenseRatio) >= 0 ? Number(item.expenseRatio) : null,
    exitLoad: typeof item.exitLoad === 'string' ? item.exitLoad.trim().slice(0, 40) : '',
    minimumInvestment: item.minimumInvestment == null || String(item.minimumInvestment).trim() === '' ? null : Number.isFinite(Number(item.minimumInvestment)) && Number(item.minimumInvestment) >= 0 ? Number(item.minimumInvestment) : null,
    defaultStampDuty: item.defaultStampDuty == null || String(item.defaultStampDuty).trim() === '' ? null : Number.isFinite(Number(item.defaultStampDuty)) && Number(item.defaultStampDuty) >= 0 ? Number(item.defaultStampDuty) : null,
    currentNav,
    navHistory,
    createdAt: Number.isFinite(Number(item.createdAt)) ? Number(item.createdAt) : 0,
  };
}

export function normalizeFundPurchase(value: unknown): FundPurchase | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<FundPurchase>;
  const investedAmount = finitePositive(item.investedAmount);
  const purchasedNav = finitePositive(item.purchasedNav);
  const stampDuty = Number(item.stampDuty ?? 0);
  if (typeof item.id !== 'string' || !item.id || typeof item.fundId !== 'string' || !item.fundId || !investedAmount || !purchasedNav || !Number.isFinite(stampDuty) || stampDuty < 0 || stampDuty > investedAmount || !validDate(item.purchasedDate) || !validDate(item.executionDate)) return null;
  const suppliedUnits = Number(item.units);
  const units = Number.isFinite(suppliedUnits) && suppliedUnits > 0 ? suppliedUnits : calculateUnitsAllotted(calculateNetSpent(investedAmount, stampDuty), purchasedNav);
  return { id: item.id, fundId: item.fundId, purchasedDate: item.purchasedDate, executionDate: item.executionDate, investedAmount, stampDuty, purchasedNav, units };
}

export function currentFundTotals(fund: MutualFund, purchases: FundPurchase[]) {
  const rows = purchases.filter((item) => item.fundId === fund.id);
  const invested = rows.reduce((sum, item) => sum + item.investedAmount, 0);
  const netSpent = rows.reduce((sum, item) => sum + calculateNetSpent(item.investedAmount, item.stampDuty), 0);
  const stampDuty = rows.reduce((sum, item) => sum + item.stampDuty, 0);
  const units = rows.reduce((sum, item) => sum + item.units, 0);
  const marketValue = calculateCurrentMarketValue(units, fund.currentNav);
  const profitLoss = calculateProfitLoss(marketValue, netSpent);
  const averageNav = rows.length ? rows.reduce((total, item) => total + item.purchasedNav, 0) / rows.length : 0;
  return { invested, netSpent, stampDuty, units, averageNav, marketValue, profitLoss, roi: calculateReturnsPercentage(profitLoss, netSpent), installments: rows.length };
}

export function monthlyPortfolioValue(funds: MutualFund[], purchases: FundPurchase[], date: string, category?: string): number {
  return funds.filter((fund) => !category || fund.category === category).reduce((sum, fund) => {
    // Units enter the portfolio on execution, which can differ from the order date.
    const heldUnits = purchases.filter((row) => row.fundId === fund.id && row.executionDate <= date).reduce((units, row) => units + row.units, 0);
    if (!heldUnits) return sum;
    const snapshot = [...fund.navHistory].filter((point) => point.date <= date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const lastPurchaseNav = purchases.filter((row) => row.fundId === fund.id && row.executionDate <= date).sort((a, b) => b.executionDate.localeCompare(a.executionDate))[0]?.purchasedNav;
    return sum + heldUnits * (snapshot?.nav || lastPurchaseNav || 0);
  }, 0);
}
