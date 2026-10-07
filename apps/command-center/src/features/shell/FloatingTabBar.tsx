import { Link, usePathname, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from '@/components/icons';
import { Appear, Text } from '@/components/ui';
import { useTransactionForm } from '@/features/expenses/state/transactionForm';
import { useTheme } from '@/theme';
import { isActive, mobileMore, mobileTabs } from './navigation';

/**
 * Phone navigation: a floating ink bar whose active tab expands into a lime
 * pill with its label, plus a separate lime quick-add button.
 */
export function FloatingTabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const openNew = useTransactionForm((state) => state.openNew);
  const moreActive = mobileMore.some((item) => isActive(pathname, item.href));
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + theme.space[3],
        flexDirection: 'row',
        gap: theme.space[2],
        paddingHorizontal: theme.space[3],
      }}
    >
      <View
        role="navigation"
        aria-label="Main"
        style={{
          flex: 1,
          height: 60,
          borderRadius: 30,
          paddingHorizontal: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.ink,
          ...theme.elevation(3),
        }}
      >
        {mobileTabs.map((item) => {
          const active =
            item.name === 'more'
              ? moreActive || isActive(pathname, item.href)
              : isActive(pathname, item.href);
          return (
            <Link key={item.name} href={item.href as Href} asChild>
              <Pressable
                accessibilityLabel={item.label}
                aria-current={active ? 'page' : undefined}
                accessibilityState={{ selected: active }}
                style={StyleSheet.flatten({
                  height: 48,
                  minWidth: 48,
                  paddingHorizontal: active ? 14 : 0,
                  borderRadius: 24,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: active ? theme.colors.primary : 'transparent',
                })}
              >
                <item.icon
                  size={20}
                  color={active ? theme.colors.onPrimary : theme.colors.onInkMuted}
                  strokeWidth={2}
                />
                {active ? (
                  <Appear duration={200}>
                    <Text variant="label" color="onPrimary" numberOfLines={1}>
                      {item.shortLabel ?? item.label}
                    </Text>
                  </Appear>
                ) : null}
              </Pressable>
            </Link>
          );
        })}
      </View>
      <Pressable
        role="button"
        accessibilityLabel="Quick add"
        onPress={() => openNew()}
        style={({ pressed }) => ({
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? theme.colors.primaryPressed : theme.colors.primary,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          ...theme.elevation(3),
        })}
      >
        <Plus size={26} color={theme.colors.onPrimary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}
