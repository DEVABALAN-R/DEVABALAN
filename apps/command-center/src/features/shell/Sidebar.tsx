import { PanelLeftClose, PanelLeftOpen } from '@/components/icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavItem } from '@/components/navigation/NavItem';
import { IconButton, Text } from '@/components/ui';
import { layout, useTheme } from '@/theme';
import { BrandIcon, sidebarFooter, sidebarMain } from './navigation';

type SidebarProps = { collapsed: boolean; onToggle?: () => void };

/** Desktop sidebar (collapsible) and tablet icon rail (always collapsed, no toggle). */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      role="navigation"
      aria-label="Main"
      style={{
        width: collapsed ? layout.sidebarCollapsed : layout.sidebarExpanded,
        paddingTop: insets.top + theme.space[4],
        paddingBottom: insets.bottom + theme.space[4],
        paddingHorizontal: theme.space[3],
        backgroundColor: theme.colors.surface,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
        gap: theme.space[4],
        zIndex: 10,
      }}
    >
      <View
        style={{
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          gap: theme.space[2],
          minHeight: 44,
        }}
      >
        <View
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BrandIcon size={20} color={theme.colors.onAccent} strokeWidth={2} />
        </View>
        {collapsed ? null : (
          <Text variant="title" style={{ flex: 1 }} numberOfLines={1}>
            Devabalan
          </Text>
        )}
        {onToggle ? (
          <IconButton
            icon={collapsed ? PanelLeftOpen : PanelLeftClose}
            accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            size="sm"
            onPress={onToggle}
          />
        ) : null}
      </View>
      <View style={{ flex: 1, gap: theme.space[1] }}>
        {sidebarMain.map((item) => (
          <NavItem key={item.name} {...item} variant="sidebar" collapsed={collapsed} />
        ))}
      </View>
      <View style={{ gap: theme.space[1] }}>
        {sidebarFooter.map((item) => (
          <NavItem key={item.name} {...item} variant="sidebar" collapsed={collapsed} />
        ))}
      </View>
    </View>
  );
}
