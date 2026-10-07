import type { LucideIcon } from '@/components/icons';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';
import { useInteractionState } from '@/hooks/useInteractionState';
import { minHitSize, useTheme, type ColorRoles } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
};

const heights: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };

function palette(variant: ButtonVariant, colors: ColorRoles) {
  switch (variant) {
    case 'primary':
      return {
        bg: colors.accent,
        bgActive: colors.accentPressed,
        fg: 'onAccent',
        border: colors.accent,
      } as const;
    case 'danger':
      return {
        bg: colors.danger,
        bgActive: colors.danger,
        fg: 'onDanger',
        border: colors.danger,
      } as const;
    case 'secondary':
      return {
        bg: colors.surface,
        bgActive: colors.surfaceMuted,
        fg: 'textPrimary',
        border: colors.borderStrong,
      } as const;
    case 'ghost':
      return {
        bg: 'transparent',
        bgActive: colors.surfaceMuted,
        fg: 'accent',
        border: 'transparent',
      } as const;
  }
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const { hovered, focused, handlers } = useInteractionState();
  const colors = palette(variant, theme.colors);
  const inactive = disabled || loading;

  return (
    <Pressable
      role="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      hitSlop={size === 'sm' ? (minHitSize - heights.sm) / 2 : undefined}
      {...handlers}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          paddingHorizontal: size === 'sm' ? theme.space[3] : theme.space[4],
          borderRadius: theme.radius.md,
          backgroundColor: pressed || hovered ? colors.bgActive : colors.bg,
          borderColor: colors.border,
          opacity: inactive ? 0.5 : pressed && variant === 'danger' ? 0.85 : 1,
          // Let the parent align it (row bars centre it); stretch only when asked.
          alignSelf: fullWidth ? 'stretch' : undefined,
        },
        focused && {
          outlineColor: theme.colors.focus,
          outlineWidth: 2,
          outlineOffset: 2,
          outlineStyle: 'solid',
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors[colors.fg]} />
        ) : Icon ? (
          <Icon size={size === 'lg' ? 20 : 18} color={theme.colors[colors.fg]} strokeWidth={2} />
        ) : null}
        <Text variant={size === 'lg' ? 'bodyStrong' : 'label'} color={colors.fg} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
