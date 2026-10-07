import { Link, usePathname, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { ChartPie, List, Tag, Target, type LucideIcon } from '@/components/icons';
import { Text } from '@/components/ui';
import { useInteractionState } from '@/hooks/useInteractionState';
import { useTheme } from '@/theme';

const sections: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard/expenses', label: 'Transactions', icon: List },
  { href: '/dashboard/expenses/stats', label: 'Stats', icon: ChartPie },
  { href: '/dashboard/expenses/budget', label: 'Budget', icon: Target },
  { href: '/dashboard/expenses/categories', label: 'Categories', icon: Tag },
];

/** Sub-navigation shared by every Expenses page (Money Manager: Trans. · Stats · Budget · Settings). */
export function SectionTabs() {
  const theme = useTheme();
  const pathname = usePathname();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        padding: 4,
        gap: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surface,
      }}
    >
      {sections.map((section) => (
        <SectionLink key={section.href} {...section} active={pathname === section.href} />
      ))}
    </ScrollView>
  );
}

function SectionLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  return (
    <Link href={href as Href} asChild>
      <Pressable
        accessibilityLabel={label}
        aria-current={active ? 'page' : undefined}
        accessibilityState={{ selected: active }}
        {...handlers}
        style={StyleSheet.flatten([
          {
            height: 36,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: theme.space[4],
            borderRadius: theme.radius.pill,
            backgroundColor: active
              ? theme.colors.ink
              : hovered
                ? theme.colors.surfaceMuted
                : 'transparent',
          },
          focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
        ])}
      >
        <Icon
          size={16}
          color={active ? theme.colors.onInk : theme.colors.textSecondary}
          strokeWidth={2}
        />
        <Text variant="label" color={active ? 'onInk' : 'textSecondary'} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}
