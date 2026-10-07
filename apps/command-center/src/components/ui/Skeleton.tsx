import { useEffect } from 'react';
import type { DimensionValue } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useMotion, useTheme } from '@/theme';

type SkeletonProps = { width?: DimensionValue; height?: number; radius?: number };

/**
 * Placeholder block. Decorative only: the loading region that contains it is
 * responsible for announcing "Loading …" to assistive tech.
 */
export function Skeleton({ width = '100%', height = 16, radius }: SkeletonProps) {
  const theme = useTheme();
  const { reduceMotion } = useMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      aria-hidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radius.sm,
          backgroundColor: theme.colors.surfaceMuted,
        },
        animated,
      ]}
    />
  );
}
