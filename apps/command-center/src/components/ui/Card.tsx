import type { ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useInteractionState } from '@/hooks/useInteractionState';
import { useMotion, useTheme, type SpaceToken } from '@/theme';
import { GradientFill } from './GradientFill';

export type CardVariant = 'default' | 'muted' | 'brand' | 'ink' | 'primary';

type CardProps = {
  children: ReactNode;
  variant?: CardVariant;
  padding?: SpaceToken;
  style?: StyleProp<ViewStyle>;
  /** Position in a group; staggers the entrance animation. */
  index?: number;
  /** When provided the whole card becomes one pressable target. */
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
};

/** Rounded bento card. `brand` is the green gradient hero used once per screen. */
export function Card({
  children,
  variant = 'default',
  padding = 5,
  style,
  index,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const theme = useTheme();
  const { reduceMotion } = useMotion();
  const { hovered, focused, handlers } = useInteractionState();
  const background = {
    default: theme.colors.surface,
    muted: theme.colors.surfaceMuted,
    brand: theme.colors.brandTo,
    ink: theme.colors.ink,
    primary: theme.colors.primary,
  }[variant];
  const base: ViewStyle = {
    backgroundColor: background,
    borderRadius: theme.radius.xl,
    padding: theme.space[padding],
    overflow: 'hidden',
    borderWidth: theme.scheme === 'dark' && variant === 'default' ? 1 : 0,
    borderColor: theme.colors.border,
  };
  const entering =
    index === undefined || reduceMotion
      ? undefined
      : FadeInDown.duration(380).delay(Math.min(index, 10) * 55);
  const content = (
    <>
      {variant === 'brand' ? (
        <GradientFill
          from={theme.colors.brandFrom}
          to={theme.colors.brandTo}
          glow={theme.colors.primary}
        />
      ) : null}
      {children}
    </>
  );

  if (!onPress) {
    return (
      <Animated.View entering={entering} style={[base, style]}>
        {content}
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={entering} style={[{ borderRadius: theme.radius.xl }, style]}>
      <Pressable
        role="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        {...handlers}
        style={({ pressed }) => [
          base,
          { flex: 1 },
          hovered && { ...theme.elevation(2), transform: [{ translateY: -2 }] },
          pressed && { transform: [{ scale: 0.99 }] },
          focused && { outlineColor: theme.colors.focus, outlineWidth: 2, outlineStyle: 'solid' },
        ]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}

/** Plain inner container used inside cards (e.g. a muted "wallet" tile). */
export function Tile({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.lg,
          padding: theme.space[3],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
