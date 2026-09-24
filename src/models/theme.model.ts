export interface ColorTokens {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  accent: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderSubtle: string;
  statusReceived: string;
  statusVerification: string;
  statusCategorised: string;
  statusAssistance: string;
  statusResolved: string;
  statusRejected: string;
  statusOnHold: string;
  cardShadow: string;
  primaryContainer?: string;
  onPrimaryContainer?: string;
  secondaryContainer?: string;
  onSecondaryContainer?: string;
  error?: string;
  errorContainer?: string;
  onErrorContainer?: string;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface TypographyTokens {
  fontFamilySans: string;
  fontFamilySerif: string;
  fontSizeXs: number;
  fontSizeSm: number;
  fontSizeBase: number;
  fontSizeLg: number;
  fontSizeXl: number;
  fontSizeXxl: number;
  fontWeightNormal: '400';
  fontWeightMedium: '500';
  fontWeightBold: '700';
  fontWeightBlack: '900';
}

export interface AppTheme {
  isDark: boolean;
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}
