import { useMemo } from 'react';
import {
  subcategoriesOf,
  topLevelCategories,
  TRANSFER_FEES_ID,
  type Category,
  type Slice,
} from '@/lib/domain/expenses';
import { useTheme } from '@/theme';
import { useExpenseStore } from './state/expenseStore';

/**
 * Chart colour slot for each slice. A category keeps its own slot (its position
 * among its siblings), so Food has the same colour every month; when two
 * visible slices would share a slot, the smaller one takes the next free slot.
 * Buckets without a category (Other, Uncategorized, fees) get null.
 */
export function sliceSlots(slices: Slice[], categories: Category[], size: number) {
  const position = new Map<string, number>();
  for (const kind of ['expense', 'income'] as const) {
    topLevelCategories(categories, kind).forEach((parent, index) => {
      position.set(parent.id, index);
      subcategoriesOf(categories, parent.id).forEach((sub, subIndex) =>
        position.set(sub.id, subIndex + 1),
      );
    });
  }
  const used = new Set<number>();
  return slices.map((slice) => {
    const preferred = slice.category ? position.get(slice.category.id) : undefined;
    if (preferred === undefined) return null;
    for (let step = 0; step < size; step += 1) {
      const slot = (preferred + step) % size;
      if (!used.has(slot)) {
        used.add(slot);
        return slot;
      }
    }
    return null;
  });
}

/** Resolved colours for a list of slices (same order). */
export function useSliceColors(slices: Slice[]): string[] {
  const theme = useTheme();
  const categories = useExpenseStore((state) => state.categories);
  return useMemo(() => {
    const palette = theme.colors.chart;
    return sliceSlots(slices, categories, palette.length).map((slot, index) =>
      slot === null
        ? slices[index].id === TRANSFER_FEES_ID
          ? theme.colors.transfer
          : theme.colors.borderStrong
        : palette[slot],
    );
  }, [slices, categories, theme]);
}
