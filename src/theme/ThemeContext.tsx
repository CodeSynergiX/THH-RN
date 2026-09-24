import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, ColorTokens } from '../models/theme.model';
import { createTheme, mapServerTokens } from './tokens';
import { configService } from '../services/configService';

import { defaultApiClient } from '../services/apiClient';

export const resolveMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  let resolved = url.trim();
  const apiBase = defaultApiClient.getBaseUrl();
  const host = apiBase.replace(/\/api\/v1\/?$/, '');

  if (resolved.startsWith('/')) {
    resolved = `${host}${resolved}`;
  } else if (
    resolved.includes('localhost:8000') ||
    resolved.includes('127.0.0.1:8000')
  ) {
    if (host && host.startsWith('http')) {
      resolved = resolved
        .replace('http://localhost:8000', host)
        .replace('http://127.0.0.1:8000', host);
    } else if (Platform.OS === 'android') {
      resolved = resolved
        .replace('http://localhost:8000', 'http://10.0.2.2:8000')
        .replace('http://127.0.0.1:8000', 'http://10.0.2.2:8000');
    }
  }
  return resolved;
};

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleDarkMode: () => void;
  syncThemeFromServer: () => Promise<void>;
  logoUrl: string | null;
  brandName: string;
  brandNameEn: string;
  brandNameGu: string;
  brandShortName: string;
  brandShortNameEn: string;
  brandShortNameGu: string;
  helpline: string;
  supportEmail: string;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  locale?: string; // injected from LanguageProvider bridge
}

const THEME_MODE_KEY = '@thh_theme_mode';
const THEME_TOKENS_KEY = '@thh_custom_tokens';
const BRANDING_CACHE_KEY = '@thh_branding_cache';

const defaultTheme = createTheme(false);

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  toggleDarkMode: () => {},
  syncThemeFromServer: async () => {},
  logoUrl: null,
  brandName: 'Tribal Helping Hand',
  brandNameEn: 'Tribal Helping Hand',
  brandNameGu: 'આદિવાસી સહાયક હાથ',
  brandShortName: 'THH',
  brandShortNameEn: 'THH',
  brandShortNameGu: 'ટીએચએચ',
  helpline: '1800-233-5500',
  supportEmail: 'support@ggvt.org',
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  locale = 'gu',
}) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [lightColors, setLightColors] = useState<Partial<ColorTokens>>({});
  const [darkColors, setDarkColors] = useState<Partial<ColorTokens>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandNameEn, setBrandNameEn] = useState('Tribal Helping Hand');
  const [brandNameGu, setBrandNameGu] = useState('આદિવાસી સહાયક હાથ');
  const [brandShortNameEn, setBrandShortNameEn] = useState('THH');
  const [brandShortNameGu, setBrandShortNameGu] = useState('ટીએચએચ');
  const [helpline, setHelpline] = useState('1800-233-5500');
  const [supportEmail, setSupportEmail] = useState('support@ggvt.org');

  // Derived reactively from locale prop — updates instantly on language switch
  const brandName = locale === 'gu' ? brandNameGu : brandNameEn;
  const brandShortName = locale === 'gu' ? brandShortNameGu : brandShortNameEn;

  const persistPalettes = async (
    light: Partial<ColorTokens>,
    dark: Partial<ColorTokens>,
  ) => {
    await AsyncStorage.setItem(
      THEME_TOKENS_KEY,
      JSON.stringify({ light, dark }),
    );
  };

  const syncThemeFromServer = useCallback(async () => {
    try {
      const serverTheme = await configService.getTheme();
      if (!serverTheme) {
        return;
      }

      // Handle direct or nested data structure from backend
      const rawData = (serverTheme as any)?.data || serverTheme;

      if (rawData?.branding) {
        const b = rawData.branding;
        const resolvedLogo = resolveMediaUrl(b.logo_url);
        const nameEn = b.name_en || b.name || 'Tribal Helping Hand';
        const nameGu = b.name_gu || b.name || 'આદિવાસી સહાયક હાથ';
        const shortName = b.name_short || 'THH';
        const shortNameEn = b.name_short_en || shortName;
        const shortNameGu = b.name_short_gu || shortName;
        const help = b.helpline || '1800-233-5500';
        const email = b.support_email || 'support@ggvt.org';

        setLogoUrl(resolvedLogo);
        setBrandNameEn(nameEn);
        setBrandNameGu(nameGu);
        setBrandShortNameEn(shortNameEn);
        setBrandShortNameGu(shortNameGu);
        setHelpline(help);
        setSupportEmail(email);

        await AsyncStorage.setItem(
          BRANDING_CACHE_KEY,
          JSON.stringify({
            logoUrl: resolvedLogo,
            brandNameEn: nameEn,
            brandNameGu: nameGu,
            brandShortNameEn: shortNameEn,
            brandShortNameGu: shortNameGu,
            helpline: help,
            supportEmail: email,
          }),
        );
      }

      const lightRaw = (rawData?.light || rawData?.colors) as
        | Record<string, string>
        | undefined;
      const darkRaw = (rawData?.dark || rawData?.light || rawData?.colors) as
        | Record<string, string>
        | undefined;

      const light = mapServerTokens(lightRaw);
      const dark = mapServerTokens(darkRaw);

      if (light.primary || light.background || dark.primary) {
        setLightColors(light);
        setDarkColors(dark);
        await persistPalettes(light, dark);
        console.log(
          '[ThemeContext] Theme successfully synced from server on startup:',
          {
            primary: light.primary,
            secondary: light.secondary,
            accent: light.accent,
            background: light.background,
          },
        );
      }
    } catch (err) {
      console.warn(
        '[ThemeContext] Offline fallback: could not sync remote theme:',
        err,
      );
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedMode !== null) {
          setIsDark(savedMode === 'dark');
        }
        const savedTokens = await AsyncStorage.getItem(THEME_TOKENS_KEY);
        if (savedTokens) {
          const parsed = JSON.parse(savedTokens);
          if (parsed.light || parsed.dark) {
            setLightColors(parsed.light || {});
            setDarkColors(parsed.dark || {});
          } else {
            setLightColors(parsed);
          }
        }
        const cachedBranding = await AsyncStorage.getItem(BRANDING_CACHE_KEY);
        if (cachedBranding) {
          const parsed = JSON.parse(cachedBranding);
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (parsed.brandNameEn) setBrandNameEn(parsed.brandNameEn);
          if (parsed.brandNameGu) setBrandNameGu(parsed.brandNameGu);
          if (parsed.brandShortNameEn)
            setBrandShortNameEn(parsed.brandShortNameEn);
          if (parsed.brandShortNameGu)
            setBrandShortNameGu(parsed.brandShortNameGu);
          if (parsed.helpline) setHelpline(parsed.helpline);
          if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        }
      } catch (err) {
        console.warn('Error reading cached theme or branding:', err);
      }
      syncThemeFromServer();
    })();
  }, [syncThemeFromServer]);

  const toggleDarkMode = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, newMode ? 'dark' : 'light');
    } catch (err) {
      console.warn('Failed to persist theme mode:', err);
    }
  };

  const theme = useMemo(
    () => createTheme(isDark, isDark ? darkColors : lightColors),
    [isDark, darkColors, lightColors],
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleDarkMode,
        syncThemeFromServer,
        logoUrl,
        brandName,
        brandNameEn,
        brandNameGu,
        brandShortName,
        brandShortNameEn,
        brandShortNameGu,
        helpline,
        supportEmail,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => useContext(ThemeContext);
