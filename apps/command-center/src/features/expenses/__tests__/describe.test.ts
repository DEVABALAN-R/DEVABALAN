import type { Transaction } from '@/lib/domain/expenses';
import { accounts, categories, transactions } from '@/lib/domain/expenses/__fixtures__/ledger';
import { describeTransaction } from '../describe';
import { formatEntry } from '../format';
import { buildLookup } from '../hooks/useLedger';

const lookup = buildLookup(accounts, categories);
const byId = (id: string) => transactions.find((item) => item.id === id) as Transaction;

describe('describeTransaction', () => {
  it('uses the note as the title and the category path as context', () => {
    expect(describeTransaction(byId('t3'), lookup)).toMatchObject({
      title: 'Tea',
      caption: 'Food › Tea · Card',
      amount: -5_000,
      tone: 'expense',
    });
  });

  it('falls back to the category name when there is no note', () => {
    const salary = describeTransaction(byId('t1'), lookup);
    expect(salary).toMatchObject({ title: 'Salary', caption: 'Bank', amount: 8_000_000 });
    const tea = describeTransaction({ ...byId('t3'), note: '' }, lookup);
    expect(tea).toMatchObject({ title: 'Tea', caption: 'Food · Card' });
  });

  it('names missing categories and accounts instead of failing', () => {
    const orphan = { ...byId('t2'), categoryId: null, accountId: 'gone' };
    expect(describeTransaction(orphan, lookup)).toMatchObject({
      title: 'Uncategorized',
      caption: 'Deleted account',
    });
  });

  it('signs transfers only from the point of view of a filtered account', () => {
    const transfer = byId('t5');
    expect(describeTransaction(transfer, lookup)).toMatchObject({
      title: 'Transfer',
      caption: 'Bank → Card · fee ₹10',
      amount: 200_000,
      tone: 'transfer',
    });
    expect(describeTransaction(transfer, lookup, 'bank').amount).toBe(-201_000);
    expect(describeTransaction(transfer, lookup, 'card').amount).toBe(200_000);
  });
});

describe('formatEntry', () => {
  it('drops zero paise but keeps real ones', () => {
    expect(formatEntry(12_000)).toBe('₹120');
    expect(formatEntry(12_050)).toBe('₹120.50');
    expect(formatEntry(-12_000, 'always')).toBe('−₹120');
    expect(formatEntry(500, 'always')).toBe('+₹5');
  });
});
