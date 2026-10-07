import { Link, type Href } from 'expo-router';
import { useTabTrigger } from 'expo-router/ui';
import type { LucideIcon } from '@/components/icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useInteractionState } from '@/hooks/useInteractionState';
import { minHitSize, useTheme } from '@/theme';
import { Text } from '../ui/Text';
import { TooltipBubble } from '../ui/TooltipBubble';

type NavItemProps = {
  name: string;
  href: string;
  label: string;
  icon: LucideIcon;
  variant: 'sidebar' | 'tab';
  collapsed?: boolean;
  /** Force the active style (e.g. "More" while a More-only page is open). */
  activeOverride?: boolean;
};

/**
 * A navigation destination rendered as a real link (anchor on web, so it can be
 * opened in a new tab). Active state comes from the headless tab navigator.
 */
export function NavItem({
  name,
  href,
  label,
  icon: Icon,
  variant,
  collapsed = false,
  activeOverride,
}: NavItemProps) {
  const theme = useTheme();
  const { trigger } = useTabTrigger({ name, href: href as Href });
  const { hovered, focused, handlers } = useInteractionState();
  const active = activeOverride ?? trigger?.isFocused ?? false;
  const iconColor = active ? theme.colors.accent : theme.colors.textSecondary;

  if (variant === 'tab') {
    return (
      <Link href={href as Href} asChild>
        <Pressable
          aria-current={active ? 'page' : undefined}
          accessibilityState={{ selected: active }}
          accessibilityLabel={label}
          {...handlers}
          style={{
            flex: 1,
            minHeight: minHitSize,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Icon size={22} color={iconColor} strokeWidth={active ? 2.25 : 1.75} />
          <Text variant="caption" color={active ? 'accent' : 'textSecondary'} numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
      </Link>
    );
  }

  return (
    <View>
      <Link href={href as Href} asChild>
        <Pressable
          aria-current={active ? 'page' : undefined}
          accessibilityState={{ selected: active }}
          accessibilityLabel={label}
          {...handlers}
          // Link asChild forwards styles through expo-router's Slot, which rejects arrays on web.
          style={StyleSheet.flatten([
            {
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[3],
              minHeight: minHitSize,
              paddingHorizontal: theme.space[3],
              borderRadius: theme.radius.md,
              justifyContent: collapsed ? 'center' : 'flex-start',
              backgroundColor: active
                ? theme.colors.accentSoft
                : hovered
                  ? theme.colors.surfaceMuted
                  : 'transparent',
            },
            focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
          ])}
        >
          <Icon size={20} color={iconColor} strokeWidth={active ? 2.25 : 1.75} />
          {collapsed ? null : (
            <Text
              variant={active ? 'bodyStrong' : 'body'}
              color={active ? 'accent' : 'textSecondary'}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </Pressable>
      </Link>
      {collapsed && (hovered || focused) ? <TooltipBubble label={label} /> : null}
    </View>
  );
}
