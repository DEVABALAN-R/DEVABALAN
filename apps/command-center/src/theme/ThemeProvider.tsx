import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useUiStore } from '@/state/ui';
import { darkColors, lightColors, type ColorRoles } from './colors';
import { elevation, type ElevationLevel } from './elevation';
import { radius, space } from './tokens';
import { typeScale } from './typography';

export type ColorScheme = 'light' | 'dark';

export type Theme = {
  scheme: ColorScheme;
  colors: ColorRoles;
  space: typeof space;
  radius: typeof radius;
  type: typeof typeScale;
  elevation: (level: ElevationLevel) => ReturnType<typeof elevation>;
};

export function createTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    space,
    radius,
    type: typeScale,
    elevation: (level) => elevation(level, scheme),
  };
}

const ThemeContext = createContext<Theme>(createTheme('light'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useUiStore((state) => state.themePreference);
  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const theme = useMemo(() => createTheme(scheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
