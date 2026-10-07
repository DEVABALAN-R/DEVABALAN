import type { Href } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { View } from 'react-native';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { layout, useTheme } from '@/theme';
import { DesktopHeader } from './DesktopHeader';
import { FloatingTabBar } from './FloatingTabBar';
import { LeftRail } from './LeftRail';
import { MobileHeader } from './MobileHeader';
import { destinations } from './navigation';
import { PlaceholderSheets } from './PlaceholderSheets';

/**
 * Adaptive frame on Expo Router's headless tabs. The hidden TabList declares
 * every destination once; the visible chrome is chosen per breakpoint:
 * floating header + rail (tablet/desktop) or header + floating tab bar (phone).
 */
export function AppShell() {
  const theme = useTheme();
  const { isMobile } = useBreakpoint();
  return (
    <Tabs style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <TabList style={{ display: 'none' }}>
        {destinations.map((item) => (
          <TabTrigger key={item.name} name={item.name} href={item.href as Href} />
        ))}
      </TabList>
      {isMobile ? (
        <View style={{ flex: 1 }}>
          <MobileHeader />
          <TabSlot style={{ flex: 1 }} />
          <FloatingTabBar />
        </View>
      ) : (
        <View style={{ flex: 1, padding: layout.canvasPadding, gap: layout.canvasPadding }}>
          <DesktopHeader />
          <View style={{ flex: 1, flexDirection: 'row', gap: layout.canvasPadding, minHeight: 0 }}>
            <LeftRail />
            <View style={{ flex: 1, minWidth: 0 }}>
              <TabSlot style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      )}
      <PlaceholderSheets />
    </Tabs>
  );
}
