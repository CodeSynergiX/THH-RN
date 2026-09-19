import {
  AppTheme,
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
} from '../models/theme.model';

export const lightColors: ColorTokens = {
  primary: '#B45309', // Warm Ochre (tribal earth)
  primaryLight: '#D97706',
  primaryDark: '#78350F',
  secondary: '#15803D', // Forest Green (nature, leaves)
  secondaryLight: '#16A34A',
  secondaryDark: '#14532D',
  accent: '#C2410C', // Terracotta Clay
  background: '#FFFBEB', // Warm light cream
  surface: '#FFFFFF',
  surfaceSubtle: '#FEF3C7',
  text: '#1C1917', // Deep slate/brown
  textMuted: '#78716C',
  textInverse: '#FFFFFF',
  border: '#E7E5E4',
  borderSubtle: '#F5F5F4',
  statusReceived: '#4F46E5', // Indigo
  statusVerification: '#9333EA', // Purple
  statusCategorised: '#2563EB', // Blue
  statusAssistance: '#D97706', // Amber
  statusResolved: '#16A34A', // Green
  statusRejected: '#E11D48', // Rose
  statusOnHold: '#6B7280', // Gray
  cardShadow: 'rgba(28, 25, 23, 0.08)',
};

export const darkColors: ColorTokens = {
  primary: '#F59E0B', // Bright Amber for dark mode
  primaryLight: '#FBBF24',
  primaryDark: '#B45309',
  secondary: '#22C55E', // Vivid Forest Green
  secondaryLight: '#4ADE80',
  secondaryDark: '#15803D',
  accent: '#EA580C',
  background: '#0F172A', // Slate dark
  surface: '#1E293B',
  surfaceSubtle: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textInverse: '#0F172A',
  border: '#334155',
  borderSubtle: '#1E293B',
  statusReceived: '#818CF8',
  statusVerification: '#C084FC',
  statusCategorised: '#60A5FA',
  statusAssistance: '#FBBF24',
  statusResolved: '#4ADE80',
  statusRejected: '#FB7185',
  statusOnHold: '#9CA3AF',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
};

export const spacingTokens: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typographyTokens: TypographyTokens = {
  fontSizeXs: 11,
  fontSizeSm: 13,
  fontSizeBase: 15,
  fontSizeLg: 17,
  fontSizeXl: 20,
  fontSizeXxl: 26,
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  fontWeightBlack: '900',
};

export const defaultBorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export function createTheme(
  isDark: boolean,
  customColors?: Partial<ColorTokens>,
): AppTheme {
  const baseColors = isDark ? darkColors : lightColors;
  return {
    isDark,
    colors: { ...baseColors, ...customColors },
    spacing: spacingTokens,
    typography: typographyTokens,
    borderRadius: defaultBorderRadius,
  };
}

export const colors = {
  primary: '#B45309',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#E11D48',
  textPrimaryLight: '#1C1917',
  textPrimaryDark: '#F8FAFC',
  textSecondaryLight: '#78716C',
  textSecondaryDark: '#94A3B8',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#1E293B',
  borderLight: '#E7E5E4',
  borderDark: '#334155',
  backgroundLight: '#FFFBEB',
  backgroundDark: '#0F172A',
};

export const spacing = spacingTokens;
