import { categoryBreakdown, OTHER_ID, type Slice } from '@/lib/domain/expenses';
import { categories, october, transactions } from '@/lib/domain/expenses/__fixtures__/ledger';
import { sliceSlots } from '../sliceColors';

const slice = (id: string, amount: number): Slice => ({
  id,
  name: id,
  amount,
  share: 0,
  count: 1,
  category: categories.find((category) => category.id === id) ?? null,
});

describe('sliceSlots', () => {
  it('gives each category its own slot, whatever its rank this month', () => {
    const slices = categoryBreakdown(transactions, categories, 'expense', october);
    // rent (order 1), food (order 0), Uncategorized, Transfer fees
    expect(sliceSlots(slices, categories, 8)).toEqual([1, 0, null, null]);
  });

  it('moves a clashing smaller slice to the next free slot', () => {
    // With a palette of 2, gift (position 2) wants slot 0, which food holds.
    const slices = [slice('food', 30), slice('gift', 20), slice(OTHER_ID, 5)];
    expect(sliceSlots(slices, categories, 2)).toEqual([0, 1, null]);
  });

  it('places subcategories by their position under the parent', () => {
    expect(sliceSlots([slice('tea', 10), slice('food', 5)], categories, 8)).toEqual([1, 0]);
  });
});
