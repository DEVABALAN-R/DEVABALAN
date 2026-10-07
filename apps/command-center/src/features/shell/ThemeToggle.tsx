import { Monitor, Moon, Sun } from '@/components/icons';
import { IconButton } from '@/components/ui';
import { useUiStore, type ThemePreference } from '@/state/ui';

const next: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};
const icons = { system: Monitor, light: Sun, dark: Moon } as const;
const names = { system: 'system', light: 'light', dark: 'dark' } as const;

/** Cycles System → Light → Dark. The label names both the current and next state. */
export function ThemeToggle() {
  const preference = useUiStore((state) => state.themePreference);
  const setPreference = useUiStore((state) => state.setThemePreference);
  return (
    <IconButton
      icon={icons[preference]}
      accessibilityLabel={`Theme: ${names[preference]}. Switch to ${names[next[preference]]}`}
      onPress={() => setPreference(next[preference])}
    />
  );
}
