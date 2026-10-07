import {
  Briefcase,
  Bus,
  CreditCard,
  Heart,
  House,
  Landmark,
  Laptop,
  PartyPopper,
  PiggyBank,
  Pill,
  Scissors,
  ShoppingBag,
  Smartphone,
  Sofa,
  Utensils,
  Wallet,
  type LucideIcon,
} from '@/components/icons';
import { isoDate, monthShort, recentMonths, rupees, seeded } from './random';

// See ./notice.ts — design-preview sample data only.

export type SampleCategory = {
  id: string;
  name: string;
  icon: LucideIcon;
  tint: number;
  budget: number;
};

/** Category names follow the owner's existing expense app (screenshot reference). */
export const sampleCategories: SampleCategory[] = [
  { id: 'food', name: 'Food', icon: Utensils, tint: 3, budget: rupees(9000) },
  { id: 'rent', name: 'Rent', icon: House, tint: 2, budget: rupees(14000) },
  { id: 'transport', name: 'Transport', icon: Bus, tint: 6, budget: rupees(4000) },
  { id: 'shops', name: 'Shops', icon: ShoppingBag, tint: 5, budget: rupees(5000) },
  { id: 'social', name: 'Social life', icon: PartyPopper, tint: 1, budget: rupees(3500) },
  { id: 'mobile', name: 'Mobile', icon: Smartphone, tint: 7, budget: rupees(1200) },
  { id: 'household', name: 'Household', icon: Sofa, tint: 4, budget: rupees(3000) },
  { id: 'medicine', name: 'Medicine', icon: Pill, tint: 0, budget: rupees(2000) },
  { id: 'grooming', name: 'Grooming', icon: Scissors, tint: 5, budget: rupees(1500) },
  { id: 'family', name: 'Family', icon: Heart, tint: 3, budget: rupees(4000) },
];

export const incomeCategories = {
  salary: { id: 'salary', name: 'Salary', icon: Briefcase, tint: 0 },
  freelance: { id: 'freelance', name: 'Freelance', icon: Laptop, tint: 2 },
} as const;

export type SampleAccount = {
  id: string;
  name: string;
  kind: string;
  balance: number;
  icon: LucideIcon;
  tint: number;
};

export const sampleAccounts: SampleAccount[] = [
  {
    id: 'main',
    name: 'Main bank',
    kind: 'Savings',
    balance: rupees(186_420),
    icon: Landmark,
    tint: 0,
  },
  {
    id: 'salary',
    name: 'Salary account',
    kind: 'Savings',
    balance: rupees(64_310),
    icon: PiggyBank,
    tint: 2,
  },
  { id: 'cash', name: 'Cash', kind: 'Wallet', balance: rupees(4_250), icon: Wallet, tint: 4 },
  {
    id: 'card',
    name: 'Credit card',
    kind: 'Outstanding',
    balance: -rupees(18_940),
    icon: CreditCard,
    tint: 1,
  },
];

export type SampleTransaction = {
  id: string;
  date: string;
  title: string;
  categoryId: string;
  accountId: string;
  kind: 'expense' | 'income';
  amount: number;
};

const titles: Record<string, string[]> = {
  food: ['Lunch', 'Groceries', 'Biriyani', 'Coffee', 'Dosa', 'Dinner out'],
  rent: ['Monthly rent'],
  transport: ['Metro card', 'Auto ride', 'Fuel', 'Cab'],
  shops: ['Clothes', 'Electronics', 'Books'],
  social: ['Movie', 'Friends dinner', 'Gift'],
  mobile: ['Recharge'],
  household: ['Cleaning supplies', 'Kitchen items'],
  medicine: ['Pharmacy'],
  grooming: ['Haircut'],
  family: ['Parents', 'Festival shopping'],
};

/** This month's transactions up to today (newest first). */
export function sampleTransactions(today = new Date()): SampleTransaction[] {
  const random = seeded(today.getFullYear() * 100 + today.getMonth());
  const rows: SampleTransaction[] = [];
  const day = (n: number) => isoDate(new Date(today.getFullYear(), today.getMonth(), n));
  rows.push({
    id: 'inc-salary',
    date: day(1),
    title: 'Monthly salary',
    categoryId: 'salary',
    accountId: 'salary',
    kind: 'income',
    amount: rupees(85_000),
  });
  rows.push({
    id: 'exp-rent',
    date: day(2),
    title: 'Monthly rent',
    categoryId: 'rent',
    accountId: 'main',
    kind: 'expense',
    amount: rupees(14_000),
  });
  if (today.getDate() >= 15) {
    rows.push({
      id: 'inc-free',
      date: day(15),
      title: 'Client project',
      categoryId: 'freelance',
      accountId: 'main',
      kind: 'income',
      amount: rupees(18_500),
    });
  }
  const spendable = sampleCategories.filter((category) => category.id !== 'rent');
  for (let date = 1; date <= today.getDate(); date += 1) {
    const count = 1 + Math.floor(random() * 3);
    for (let index = 0; index < count; index += 1) {
      const category = spendable[Math.floor(random() ** 1.6 * spendable.length)];
      const options = titles[category.id];
      const scale = category.budget / 100 / 10;
      rows.push({
        id: `exp-${date}-${index}`,
        date: day(date),
        title: options[Math.floor(random() * options.length)],
        categoryId: category.id,
        accountId: random() > 0.55 ? 'card' : random() > 0.3 ? 'main' : 'cash',
        kind: 'expense',
        amount: rupees(Math.max(40, scale * (0.4 + random() * 1.6))),
      });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export type MonthlyFlow = { label: string; income: number; expense: number; projected: boolean };

/** Income vs expense for the last eight months; the current month is partial. */
export function sampleMonthlyFlow(today = new Date()): MonthlyFlow[] {
  const random = seeded(4242);
  const current = sampleTransactions(today);
  const sum = (kind: 'income' | 'expense') =>
    current.filter((row) => row.kind === kind).reduce((total, row) => total + row.amount, 0);
  return recentMonths(8, today).map((month, index, all) =>
    index === all.length - 1
      ? {
          label: monthShort(month),
          income: sum('income'),
          expense: sum('expense'),
          projected: true,
        }
      : {
          label: monthShort(month),
          income: rupees(85_000 + (random() > 0.5 ? 18_500 : 0) + random() * 6_000),
          expense: rupees(42_000 + random() * 22_000),
          projected: false,
        },
  );
}

export const sampleMonthlyBudget = rupees(50_000);
