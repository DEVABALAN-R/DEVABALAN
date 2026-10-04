import type { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Food & Dining', type: 'expense', subcategories: ['Groceries', 'Restaurants', 'Snacks'] },
  { name: 'Transport', type: 'expense', subcategories: ['Fuel', 'Public transport', 'Taxi'] },
  { name: 'Bills & Utilities', type: 'expense', subcategories: ['Electricity', 'Internet', 'Mobile recharge'] },
  { name: 'Home', type: 'expense', subcategories: ['Rent', 'Maintenance', 'Household'] },
  { name: 'Shopping', type: 'expense', subcategories: ['Clothing', 'Personal care'] },
  { name: 'Salary', type: 'income', subcategories: ['Monthly salary', 'Bonus'] },
  { name: 'Freelance', type: 'income', subcategories: ['Projects', 'Consulting'] },
  { name: 'Other income', type: 'income', subcategories: ['Interest', 'Refunds', 'Gifts'] },
];

export const DEFAULT_CATEGORY_PRESENTATION: Record<string, { icon: string; color: string }> = {
  'food & dining': { icon: '🍽️', color: '#D97706' },
  transport: { icon: '🚗', color: '#2563EB' },
  'bills & utilities': { icon: '⚡', color: '#7C3AED' },
  home: { icon: '🏠', color: '#0F766E' },
  shopping: { icon: '🛍️', color: '#DB2777' },
  salary: { icon: '💵', color: '#059669' },
  freelance: { icon: '💻', color: '#4F46E5' },
  'other income': { icon: '✨', color: '#0891B2' },
};
