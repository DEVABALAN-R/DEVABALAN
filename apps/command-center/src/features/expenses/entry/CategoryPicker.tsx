import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Search } from '@/components/icons';
import { Text } from '@/components/ui';
import {
  resolveCategory,
  searchCategories,
  subcategoriesOf,
  topLevelCategories,
  type Category,
  type CategoryKind,
} from '@/lib/domain/expenses';
import { fontFamily, useTheme } from '@/theme';
import { useExpenseStore } from '../state/expenseStore';
import { CategoryTile } from './CategoryTile';
import { GridRows } from './GridRows';
import { PickChip } from './PickChip';

type CategoryPickerProps = {
  kind: CategoryKind;
  selectedId: string | null;
  onChoose: (categoryId: string) => void;
  columns: number;
};

/**
 * Money Manager's category grid: a category with subcategories opens them in
 * place, under its row ("All Food" keeps the parent); search finds both levels.
 */
export function CategoryPicker({ kind, selectedId, onChoose, columns }: CategoryPickerProps) {
  const theme = useTheme();
  const categories = useExpenseStore((state) => state.categories);
  const selectedParent = resolveCategory(categories, selectedId).parent;
  const [expanded, setExpanded] = useState<string | null>(selectedParent?.id ?? null);
  const [query, setQuery] = useState('');
  const parents = useMemo(() => topLevelCategories(categories, kind), [categories, kind]);
  const results = useMemo(
    () => searchCategories(categories, kind, query),
    [categories, kind, query],
  );
  const parentName = (category: Category) =>
    categories.find((item) => item.id === category.parentId)?.name;
  return (
    <View style={{ gap: theme.space[3] }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[2],
          height: 40,
          paddingHorizontal: theme.space[3],
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}
      >
        <Search size={16} color={theme.colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories"
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel="Search categories"
          style={{
            flex: 1,
            color: theme.colors.textPrimary,
            fontFamily: fontFamily.regular,
            fontSize: 14,
            outlineWidth: 0,
          }}
        />
      </View>
      {query.trim() ? (
        results.length ? (
          <GridRows
            items={results}
            columns={columns}
            gap={theme.space[2]}
            keyOf={(category) => category.id}
            render={(category) => (
              <CategoryTile
                category={category}
                caption={parentName(category)}
                selected={category.id === selectedId}
                onPress={() => onChoose(category.id)}
              />
            )}
          />
        ) : (
          <Text color="textSecondary" align="center" style={{ paddingVertical: theme.space[4] }}>
            No category matches “{query.trim()}”.
          </Text>
        )
      ) : (
        <GridRows
          items={parents}
          columns={columns}
          gap={theme.space[2]}
          keyOf={(category) => category.id}
          render={(parent) => {
            const children = subcategoriesOf(categories, parent.id).length;
            return (
              <CategoryTile
                category={parent}
                selected={selectedParent?.id === parent.id}
                expandable={children > 0}
                expanded={expanded === parent.id}
                onPress={() =>
                  children
                    ? setExpanded(expanded === parent.id ? null : parent.id)
                    : onChoose(parent.id)
                }
              />
            );
          }}
          after={(row) => {
            const parent = row.find((item) => item.id === expanded);
            if (!parent) return null;
            return (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.space[2],
                  padding: theme.space[3],
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceMuted,
                }}
              >
                <PickChip
                  label={`All ${parent.name}`}
                  accessibilityLabel={`${parent.name}, no subcategory`}
                  selected={selectedId === parent.id}
                  onPress={() => onChoose(parent.id)}
                />
                {subcategoriesOf(categories, parent.id).map((sub) => (
                  <PickChip
                    key={sub.id}
                    label={sub.name}
                    accessibilityLabel={`${parent.name}, ${sub.name}`}
                    selected={selectedId === sub.id}
                    onPress={() => onChoose(sub.id)}
                  />
                ))}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
