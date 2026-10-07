import type { TextStyle } from 'react-native';

/** Font family names registered in src/app/_layout.tsx via expo-font. */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
export type FontWeightToken = keyof typeof fontFamily;

type TypeStyle = Required<Pick<TextStyle, 'fontSize' | 'lineHeight'>> & {
  weight: FontWeightToken;
  letterSpacing?: number;
};

/** Type scale. Nothing renders below 12px. */
export const typeScale = {
  caption: { fontSize: 12, lineHeight: 16, weight: 'medium' },
  label: { fontSize: 13, lineHeight: 18, weight: 'medium' },
  body: { fontSize: 15, lineHeight: 22, weight: 'regular' },
  bodyStrong: { fontSize: 15, lineHeight: 22, weight: 'semibold' },
  bodyLg: { fontSize: 17, lineHeight: 24, weight: 'regular' },
  title: { fontSize: 20, lineHeight: 28, weight: 'semibold', letterSpacing: -0.2 },
  h2: { fontSize: 24, lineHeight: 32, weight: 'semibold', letterSpacing: -0.3 },
  h1: { fontSize: 30, lineHeight: 36, weight: 'semibold', letterSpacing: -0.8 },
  display: { fontSize: 40, lineHeight: 46, weight: 'semibold', letterSpacing: -1.2 },
  /** Large money figures in hero/KPI cards. */
  figure: { fontSize: 32, lineHeight: 38, weight: 'semibold', letterSpacing: -0.8 },
  figureSm: { fontSize: 24, lineHeight: 30, weight: 'semibold', letterSpacing: -0.5 },
  eyebrow: { fontSize: 12, lineHeight: 16, weight: 'semibold', letterSpacing: 0.8 },
} as const satisfies Record<string, TypeStyle>;
export type TypeVariant = keyof typeof typeScale;
