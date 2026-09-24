import {
  AppTheme,
  ColorTokens,
  SpacingTokens,
  TypographyTokens,
} from '../models/theme.model';

export const lightColors: ColorTokens = {
  primary: '#006026',
  primaryLight: '#1b7a38',
  primaryDark: '#005320',
  secondary: '#79573c',
  secondaryLight: '#eabe9c',
  secondaryDark: '#5f4027',
  accent: '#1b7a38',
  background: '#fff8f5',
  surface: '#ffffff',
  surfaceSubtle: '#f5ebe4',
  backgroundSecondary: '#f5ebe4',
  surfaceSecondary: '#f5ebe4',
  text: '#2a170b',
  textMuted: '#3f493f',
  textInverse: '#ffffff',
  border: '#bfcabb',
  borderSubtle: '#dfc7b8',
  borderSecondary: '#dfc7b8',
  secondaryBg: '#f5ebe4',
  secondaryBorder: '#dfc7b8',
  statusReceived: '#2563EB',
  statusVerification: '#7C3AED',
  statusCategorised: '#4F46E5',
  statusAssistance: '#D97706',
  statusResolved: '#006026',
  statusRejected: '#ba1a1a',
  statusOnHold: '#6f7a6e',
  cardShadow: 'rgba(27, 122, 56, 0.08)',
  primaryContainer: '#1b7a38',
  onPrimaryContainer: '#ffffff',
  secondaryContainer: '#ffd1af',
  onSecondaryContainer: '#7a583d',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
};

export const darkColors: ColorTokens = {
  primary: '#7fda8c',
  primaryLight: '#9bf7a6',
  primaryDark: '#005320',
  secondary: '#eabe9c',
  secondaryLight: '#ffdcc3',
  secondaryDark: '#79573c',
  accent: '#9bf7a6',
  background: '#1a110c',
  surface: '#25180f',
  surfaceSubtle: '#342217',
  backgroundSecondary: '#2d1e13',
  surfaceSecondary: '#342217',
  text: '#ffede5',
  textMuted: '#bfcabb',
  textInverse: '#002109',
  border: '#412c1f',
  borderSubtle: '#4d3424',
  borderSecondary: '#4d3424',
  secondaryBg: '#342217',
  secondaryBorder: '#4d3424',
  statusReceived: '#60A5FA',
  statusVerification: '#A78BFA',
  statusCategorised: '#818CF8',
  statusAssistance: '#FBBF24',
  statusResolved: '#7fda8c',
  statusRejected: '#F87171',
  statusOnHold: '#9CA3AF',
  cardShadow: 'rgba(0, 0, 0, 0.4)',
  primaryContainer: '#005320',
  onPrimaryContainer: '#abffb3',
  secondaryContainer: '#5f4027',
  onSecondaryContainer: '#ffd1af',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',
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
  fontFamilySans: 'Plus Jakarta Sans',
  fontFamilySerif: 'Plus Jakarta Sans',
  fontSizeXs: 14,
  fontSizeSm: 16,
  fontSizeBase: 18,
  fontSizeLg: 20,
  fontSizeXl: 24,
  fontSizeXxl: 28,
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  fontWeightBlack: '900',
};

export const defaultBorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export function mapServerTokens(
  raw?: Record<string, string> | null,
): Partial<ColorTokens> {
  if (!raw) {
    return {};
  }
  const mapped: Partial<ColorTokens> = {};
  if (raw.primary) {
    mapped.primary = raw.primary;
  }
  if (raw.primary_light || raw.primaryLight) {
    mapped.primaryLight = raw.primary_light || raw.primaryLight;
  } else if (raw.primary) {
    mapped.primaryLight = raw.accent || raw.primary;
  }
  if (raw.primary_dark || raw.primaryDark) {
    mapped.primaryDark = raw.primary_dark || raw.primaryDark;
  }
  if (raw.primary_container || raw.primaryContainer) {
    mapped.primaryContainer = raw.primary_container || raw.primaryContainer;
  } else if (raw.accent || raw.primary) {
    mapped.primaryContainer = raw.accent || raw.primary;
  }
  if (raw.on_primary_container || raw.onPrimaryContainer) {
    mapped.onPrimaryContainer =
      raw.on_primary_container || raw.onPrimaryContainer;
  }
  if (raw.secondary) {
    mapped.secondary = raw.secondary;
  }
  if (raw.secondary_light || raw.secondaryLight) {
    mapped.secondaryLight = raw.secondary_light || raw.secondaryLight;
  }
  if (raw.secondary_dark || raw.secondaryDark) {
    mapped.secondaryDark = raw.secondary_dark || raw.secondaryDark;
  }
  if (raw.secondary_container || raw.bg_secondary || raw.secondaryContainer) {
    mapped.secondaryContainer =
      raw.secondary_container || raw.secondaryContainer || raw.bg_secondary;
  }
  if (raw.on_secondary_container || raw.onSecondaryContainer) {
    mapped.onSecondaryContainer =
      raw.on_secondary_container || raw.onSecondaryContainer;
  }
  if (raw.accent) {
    mapped.accent = raw.accent;
  }
  if (raw.bg || raw.background) {
    mapped.background = raw.bg || raw.background;
  }
  if (raw.surface) {
    mapped.surface = raw.surface;
  }
  if (
    raw.bg_secondary ||
    raw.secondary_bg ||
    raw.bgSecondary ||
    raw.secondaryBg
  ) {
    const val =
      raw.bg_secondary ||
      raw.secondary_bg ||
      raw.bgSecondary ||
      raw.secondaryBg;
    mapped.backgroundSecondary = val;
    mapped.secondaryBg = val;
  }
  if (
    raw.surface_secondary ||
    raw.secondary_surface ||
    raw.surfaceSecondary ||
    raw.secondarySurface
  ) {
    const val =
      raw.surface_secondary ||
      raw.secondary_surface ||
      raw.surfaceSecondary ||
      raw.secondarySurface;
    mapped.surfaceSecondary = val;
  }
  if (
    raw.border_secondary ||
    raw.secondary_border ||
    raw.borderSecondary ||
    raw.secondaryBorder
  ) {
    const val =
      raw.border_secondary ||
      raw.secondary_border ||
      raw.borderSecondary ||
      raw.secondaryBorder;
    mapped.borderSecondary = val;
    mapped.secondaryBorder = val;
  }
  if (
    raw.surface_subtle ||
    raw.surfaceSubtle ||
    raw.bg_secondary ||
    raw.secondary_bg
  ) {
    mapped.surfaceSubtle =
      raw.surface_subtle ||
      raw.surfaceSubtle ||
      raw.bg_secondary ||
      raw.secondary_bg;
  } else if (raw.surface) {
    mapped.surfaceSubtle = raw.surface;
  }
  if (raw.text) {
    mapped.text = raw.text;
  }
  if (raw.text_muted || raw.textMuted) {
    mapped.textMuted = raw.text_muted || raw.textMuted;
  }
  if (raw.text_inverse || raw.textInverse) {
    mapped.textInverse = raw.text_inverse || raw.textInverse;
  }
  if (raw.border) {
    mapped.border = raw.border;
  }
  if (
    raw.border_subtle ||
    raw.borderSubtle ||
    raw.border_secondary ||
    raw.secondary_border
  ) {
    mapped.borderSubtle =
      raw.border_subtle ||
      raw.borderSubtle ||
      raw.border_secondary ||
      raw.secondary_border;
  } else if (raw.border) {
    mapped.borderSubtle = raw.border;
  }
  if (raw.status_received || raw.statusReceived) {
    mapped.statusReceived = raw.status_received || raw.statusReceived;
  }
  if (raw.status_verification || raw.statusVerification) {
    mapped.statusVerification =
      raw.status_verification || raw.statusVerification;
  }
  if (raw.status_categorised || raw.statusCategorised) {
    mapped.statusCategorised = raw.status_categorised || raw.statusCategorised;
  }
  if (raw.status_assistance || raw.statusAssistance) {
    mapped.statusAssistance = raw.status_assistance || raw.statusAssistance;
  }
  if (raw.status_resolved || raw.statusResolved) {
    mapped.statusResolved = raw.status_resolved || raw.statusResolved;
  }
  if (raw.status_rejected || raw.statusRejected) {
    mapped.statusRejected = raw.status_rejected || raw.statusRejected;
  }
  if (raw.status_onhold || raw.statusOnHold) {
    mapped.statusOnHold = raw.status_onhold || raw.statusOnHold;
  }
  return mapped;
}

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
  primary: '#006026',
  success: '#006026',
  warning: '#D97706',
  danger: '#ba1a1a',
  textPrimaryLight: '#2a170b',
  textPrimaryDark: '#ffede5',
  textSecondaryLight: '#3f493f',
  textSecondaryDark: '#bfcabb',
  surfaceLight: '#ffffff',
  surfaceDark: '#25180f',
  borderLight: '#bfcabb',
  borderDark: '#412c1f',
  backgroundLight: '#fff8f5',
  backgroundDark: '#1a110c',
};

export const spacing = spacingTokens;
