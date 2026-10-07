import { useTabTrigger } from 'expo-router/ui';
import { Plus } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavItem } from '@/components/navigation/NavItem';
import { useUiStore } from '@/state/ui';
import { layout, useTheme } from '@/theme';
import { mobileMore, mobileTabs } from './navigation';

/** Mobile navigation: four destinations around a centre quick-add action. */
export function BottomBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const openQuickAdd = useUiStore((state) => state.openQuickAdd);
  const { getTrigger } = useTabTrigger({ name: 'more' });
  const moreActive = mobileMore.some((item) => getTrigger(item.name)?.isFocused);
  const [first, second, ...rest] = mobileTabs;

  return (
    <View
      role="navigation"
      aria-label="Main"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: layout.bottomBarHeight + insets.bottom,
        paddingBottom: insets.bottom,
        paddingHorizontal: theme.space[2],
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
      }}
    >
      {[first, second].map((item) => (
        <NavItem key={item.name} {...item} variant="tab" />
      ))}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Pressable
          role="button"
          accessibilityLabel="Quick add"
          onPress={openQuickAdd}
          style={({ pressed }) => ({
            width: 52,
            height: 52,
            marginTop: -theme.space[6],
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.accent,
            borderWidth: 4,
            borderColor: theme.colors.bg,
            ...theme.elevation(2),
          })}
        >
          <Plus size={24} color={theme.colors.onAccent} strokeWidth={2.5} />
        </Pressable>
      </View>
      {rest.map((item) => (
        <NavItem
          key={item.name}
          {...item}
          variant="tab"
          activeOverride={item.name === 'more' ? moreActive || undefined : undefined}
        />
      ))}
    </View>
  );
}
