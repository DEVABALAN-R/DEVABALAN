import {
  ChartPie,
  Flag,
  FileChartColumn,
  House,
  Landmark,
  Lightbulb,
  Menu,
  ReceiptText,
  Settings,
  TrendingUp,
  type LucideIcon,
} from '@/components/icons';

export type Destination = {
  /** Route name relative to src/app/dashboard (matches the file name). */
  name: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Where the destination appears. */
  placement: { sidebar: 'main' | 'footer' | 'hidden'; mobile: 'tab' | 'more' | 'hidden' };
};

export const destinations: readonly Destination[] = [
  {
    name: 'index',
    href: '/dashboard',
    label: 'Dashboard',
    icon: House,
    placement: { sidebar: 'main', mobile: 'tab' },
  },
  {
    name: 'transactions',
    href: '/dashboard/transactions',
    label: 'Transactions',
    icon: ReceiptText,
    placement: { sidebar: 'main', mobile: 'tab' },
  },
  {
    name: 'accounts',
    href: '/dashboard/accounts',
    label: 'Accounts',
    icon: Landmark,
    placement: { sidebar: 'main', mobile: 'more' },
  },
  {
    name: 'investments',
    href: '/dashboard/investments',
    label: 'Investments',
    icon: TrendingUp,
    placement: { sidebar: 'main', mobile: 'tab' },
  },
  {
    name: 'goals',
    href: '/dashboard/goals',
    label: 'Goals',
    icon: Flag,
    placement: { sidebar: 'main', mobile: 'more' },
  },
  {
    name: 'insights',
    href: '/dashboard/insights',
    label: 'Insights',
    icon: Lightbulb,
    placement: { sidebar: 'main', mobile: 'more' },
  },
  {
    name: 'reports',
    href: '/dashboard/reports',
    label: 'Reports',
    icon: FileChartColumn,
    placement: { sidebar: 'main', mobile: 'more' },
  },
  {
    name: 'settings',
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    placement: { sidebar: 'footer', mobile: 'more' },
  },
  {
    name: 'more',
    href: '/dashboard/more',
    label: 'More',
    icon: Menu,
    placement: { sidebar: 'hidden', mobile: 'tab' },
  },
];

export const sidebarMain = destinations.filter((item) => item.placement.sidebar === 'main');
export const sidebarFooter = destinations.filter((item) => item.placement.sidebar === 'footer');
export const mobileTabs = destinations.filter((item) => item.placement.mobile === 'tab');
export const mobileMore = destinations.filter((item) => item.placement.mobile === 'more');

/** Brand mark icon used by sidebar and mobile header. */
export const BrandIcon: LucideIcon = ChartPie;
