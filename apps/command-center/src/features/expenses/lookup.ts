import {
  incomeCategories,
  sampleAccounts,
  sampleCategories,
  type SampleTransaction,
} from '@/features/preview/sampleExpenses';

/** Resolves display metadata for a sample transaction (preview data only). */
export function describe(row: SampleTransaction) {
  const category =
    row.kind === 'income'
      ? incomeCategories[row.categoryId as keyof typeof incomeCategories]
      : sampleCategories.find((item) => item.id === row.categoryId);
  const account = sampleAccounts.find((item) => item.id === row.accountId);
  return {
    category,
    account,
    categoryIndex: sampleCategories.findIndex((item) => item.id === row.categoryId),
  };
}

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(
    new Date(`${iso}T12:00:00`),
  );

export const dayHeading = (iso: string, today = new Date()) => {
  const date = new Date(`${iso}T12:00:00`);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const diff = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  }).format(date);
};
