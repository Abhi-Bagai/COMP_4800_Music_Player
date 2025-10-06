export type ThemeMode = 'light' | 'dark';

export type ThemeColorRole =
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'primary'
  | 'primaryMuted'
  | 'onPrimary'
  | 'secondary'
  | 'onSecondary'
  | 'text'
  | 'subtleText'
  | 'border'
  | 'accent'
  | 'danger'
  | 'success';

export type ThemeSpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export type ThemeRadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'pill';

export type ThemeFontSizeToken = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ThemeTokens {
  colors: Record<ThemeColorRole, string>;
  spacing: Record<ThemeSpacingToken, number>;
  radius: Record<ThemeRadiusToken, number>;
  fontSize: Record<ThemeFontSizeToken, number>;
  typography: {
    weightRegular: string;
    weightMedium: string;
    weightBold: string;
    family: string;
    monoFamily: string;
  };
}

const baseSpacing: ThemeTokens['spacing'] = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

const baseRadius: ThemeTokens['radius'] = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  pill: 999,
};

const baseFontSize: ThemeTokens['fontSize'] = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const typography = {
  weightRegular: '400',
  weightMedium: '500',
  weightBold: '600',
  family: 'System',
  monoFamily: 'Menlo',
};

const lightColors: ThemeTokens['colors'] = {
  background: '#F7F9FB',
  surface: '#FFFFFF',
  surfaceElevated: '#EDF1F7',
  primary: '#2563EB',
  primaryMuted: '#AEC8FF',
  onPrimary: '#FFFFFF',
  secondary: '#6366F1',
  onSecondary: '#FFFFFF',
  text: '#0F172A',
  subtleText: '#475569',
  border: '#CBD5F5',
  accent: '#14B8A6',
  danger: '#EF4444',
  success: '#22C55E',
};

const darkColors: ThemeTokens['colors'] = {
  background: '#0F172A',
  surface: '#111C36',
  surfaceElevated: '#152347',
  primary: '#60A5FA',
  primaryMuted: '#1E3A8A',
  onPrimary: '#0B1120',
  secondary: '#818CF8',
  onSecondary: '#0B1120',
  text: '#E2E8F0',
  subtleText: '#94A3B8',
  border: '#1E3A8A',
  accent: '#2DD4BF',
  danger: '#F87171',
  success: '#4ADE80',
};

export const themeTokens: Record<ThemeMode, ThemeTokens> = {
  light: {
    colors: lightColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
  },
  dark: {
    colors: darkColors,
    spacing: baseSpacing,
    radius: baseRadius,
    fontSize: baseFontSize,
    typography,
  },
};

export const getTokens = (mode: ThemeMode) => themeTokens[mode];
