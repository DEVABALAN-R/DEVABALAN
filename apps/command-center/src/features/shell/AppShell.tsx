import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import type { Href } from 'expo-router';
import { View } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useUiStore } from '@/state/ui';
import { useTheme } from '@/theme';
import { BottomBar } from './BottomBar';
import { destinations } from './navigation';
import { QuickAddSheet } from './QuickAddSheet';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

/**
 * Adaptive application frame built on Expo Router's headless tabs.
 * The hidden TabList declares every destination once; the visible chrome
 * (sidebar, rail or bottom bar) is chosen by breakpoint, so desktop and mobile
 * share one route tree and one URL scheme.
 */
export function AppShell() {
  const theme = useTheme();
  const { mode } = useBreakpoint();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <Tabs
      style={{
        flex: 1,
        flexDirection: mode === 'mobile' ? 'column' : 'row',
        backgroundColor: theme.colors.bg,
      }}
    >
      <TabList style={{ display: 'none' }}>
        {destinations.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href as Href} />
        ))}
      </TabList>
      {mode === 'desktop' ? <Sidebar collapsed={collapsed} onToggle={toggleSidebar} /> : null}
      {mode === 'tablet' ? <Sidebar collapsed /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <TopBar />
        <TabSlot style={{ flex: 1 }} />
      </View>
      {mode === 'mobile' ? <BottomBar /> : null}
      <QuickAddSheet />
    </Tabs>
  );
}
