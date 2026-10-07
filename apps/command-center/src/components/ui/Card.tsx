import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useInteractionState } from '@/hooks/useInteractionState';
import { useTheme, type SpaceToken } from '@/theme';

type CardProps = {
  children: ReactNode;
  padding?: SpaceToken;
  tone?: 'default' | 'muted' | 'accent';
  style?: StyleProp<ViewStyle>;
  /** When provided the whole card becomes one pressable target. */
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
};

export function Card({
  children,
  padding = 5,
  tone = 'default',
  style,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  const background =
    tone === 'muted'
      ? theme.colors.surfaceMuted
      : tone === 'accent'
        ? theme.colors.accentSoft
        : theme.colors.surface;
  const base: ViewStyle = {
    backgroundColor: background,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.space[padding],
    ...theme.elevation(tone === 'default' ? 1 : 0),
  };

  if (!onPress) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable
      role="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      {...handlers}
      style={({ pressed }) => [
        base,
        (hovered || pressed) && { borderColor: theme.colors.borderStrong, ...theme.elevation(2) },
        focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
