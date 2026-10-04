export type DashboardView = 'home' | 'money' | 'accounts' | 'categories' | 'stock' | 'mutual-funds' | 'portfolio';

const viewByPath: Record<string, DashboardView> = {
  '/dashboard': 'home',
  '/dashboard/finance/expense': 'money',
  '/dashboard/finance/accounts': 'accounts',
  '/dashboard/finance/categories': 'categories',
  '/dashboard/stock': 'stock',
  '/dashboard/stock/mutual-funds': 'mutual-funds',
  '/dashboard/portfolio': 'portfolio',
};

const pathByView: Record<DashboardView, string> = {
  home: '/dashboard',
  money: '/dashboard/finance/expense',
  accounts: '/dashboard/finance/accounts',
  categories: '/dashboard/finance/categories',
  stock: '/dashboard/stock',
  'mutual-funds': '/dashboard/stock/mutual-funds',
  portfolio: '/dashboard/portfolio',
};

export function dashboardViewFromPath(pathname: string): DashboardView | null {
  return viewByPath[pathname] || null;
}

export function dashboardPathForView(view: DashboardView): string {
  return pathByView[view];
}

export function isPrivateDashboardPath(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}
