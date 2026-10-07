import { View } from 'react-native';
import { useTheme, type ColorRoles } from '@/theme';

type ProgressTone = Extract<
  keyof ColorRoles,
  'accent' | 'success' | 'warning' | 'danger' | 'investment'
>;

type ProgressBarProps = {
  /** 0–1; values outside are clamped. */
  value: number;
  /** Names what is measured, e.g. "Food budget used". */
  accessibilityLabel: string;
  tone?: ProgressTone;
  height?: number;
};

export function ProgressBar({
  value,
  accessibilityLabel,
  tone = 'accent',
  height = 8,
}: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  const percent = Math.round(clamped * 100);
  return (
    <View
      role="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} percent` }}
      style={{
        height,
        borderRadius: height / 2,
        backgroundColor: theme.colors.surfaceMuted,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: theme.colors[tone],
        }}
      />
    </View>
  );
}
