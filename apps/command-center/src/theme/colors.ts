/**
 * Semantic colour roles for light and dark. Components must use roles, never hex.
 * Values derive from the existing app's finance-tokens.css (indigo accent, slate
 * neutrals); contrast is enforced by src/theme/__tests__/contrast.test.ts.
 */
export type ColorRoles = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  /** Boundaries of interactive controls (≥ 3:1 against surface). */
  borderStrong: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentPressed: string;
  accentSoft: string;
  onAccent: string;
  focus: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  transfer: string;
  transferSoft: string;
  investment: string;
  investmentSoft: string;
  profit: string;
  loss: string;
  neutral: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  onDanger: string;
  info: string;
  infoSoft: string;
  scrim: string;
  /** Toasts and tooltips: high-emphasis surface opposite to the page. */
  inverseSurface: string;
  onInverseSurface: string;
  inverseAccent: string;
  /** Categorical series, fixed order (never cycled). Validated with the dataviz
   * palette checker: all adjacent pairs pass CVD ΔE ≥ 8 and normal ΔE ≥ 15 in both
   * modes. Light slots 3–5 are < 3:1 on white, so charts must ship direct labels
   * or a table view (relief rule). Beyond 8 series, fold into "Other". */
  chart: readonly string[];
  chartGrid: string;
};

export const lightColors: ColorRoles = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F2F7',
  surfaceRaised: '#FFFFFF',
  border: '#E3E6EE',
  borderStrong: '#8A94A6',
  textPrimary: '#172033',
  textSecondary: '#4B5567',
  textTertiary: '#5F697B',
  accent: '#4F46E5',
  accentPressed: '#4338CA',
  accentSoft: '#ECEBFC',
  onAccent: '#FFFFFF',
  focus: '#4F46E5',
  income: '#15803D',
  incomeSoft: '#EDF8F1',
  expense: '#B42318',
  expenseSoft: '#FDECEA',
  transfer: '#475A80',
  transferSoft: '#E9EDF5',
  investment: '#6D28D9',
  investmentSoft: '#F1EAFD',
  profit: '#15803D',
  loss: '#B42318',
  neutral: '#4B5567',
  success: '#15803D',
  successSoft: '#EDF8F1',
  warning: '#A15C07',
  warningSoft: '#FDF4DC',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  onDanger: '#FFFFFF',
  info: '#1D4ED8',
  infoSoft: '#E8EEFD',
  scrim: 'rgba(15, 23, 42, 0.45)',
  inverseSurface: '#172033',
  onInverseSurface: '#F1F5F9',
  inverseAccent: '#A5B4FC',
  chart: ['#2A78D6', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948'],
  chartGrid: '#E3E6EE',
};

export const darkColors: ColorRoles = {
  bg: '#0B0F17',
  surface: '#151A24',
  surfaceMuted: '#1B2130',
  surfaceRaised: '#1E2532',
  border: '#262E3D',
  borderStrong: '#6B7588',
  textPrimary: '#F1F5F9',
  textSecondary: '#AAB6C8',
  textTertiary: '#8D99AB',
  accent: '#818CF8',
  accentPressed: '#A5B4FC',
  accentSoft: '#23264A',
  onAccent: '#0B0F17',
  focus: '#A5B4FC',
  income: '#34D399',
  incomeSoft: '#0F2A22',
  expense: '#F87171',
  expenseSoft: '#341719',
  transfer: '#93A4C3',
  transferSoft: '#1D2433',
  investment: '#C4B5FD',
  investmentSoft: '#251E3D',
  profit: '#34D399',
  loss: '#F87171',
  neutral: '#AAB6C8',
  success: '#34D399',
  successSoft: '#0F2A22',
  warning: '#FBBF24',
  warningSoft: '#2E2510',
  danger: '#F87171',
  dangerSoft: '#341719',
  onDanger: '#0B0F17',
  info: '#60A5FA',
  infoSoft: '#132339',
  scrim: 'rgba(0, 0, 0, 0.6)',
  inverseSurface: '#F1F5F9',
  onInverseSurface: '#172033',
  inverseAccent: '#4338CA',
  chart: ['#3987E5', '#D95926', '#199E70', '#C98500', '#D55181', '#008300', '#9085E9', '#E66767'],
  chartGrid: '#262E3D',
};
