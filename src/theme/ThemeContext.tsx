import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, ColorTokens } from '../models/theme.model';
import { createTheme } from './tokens';
import { configService } from '../services/configService';

interface ThemeContextType {
  theme: AppTheme;
  isDark: boolean;
  toggleDarkMode: () => void;
  syncThemeFromServer: () => Promise<void>;
}

const THEME_MODE_KEY = '@thh_theme_mode';
const THEME_TOKENS_KEY = '@thh_custom_tokens';

const defaultTheme = createTheme(false);

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isDark: false,
  toggleDarkMode: () => {},
  syncThemeFromServer: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState<Partial<ColorTokens>>({});

  useEffect(() => {
    // Load cached preference
    (async () => {
      try {
        const savedMode = await AsyncStorage.getItem(THEME_MODE_KEY);
        if (savedMode !== null) {
          setIsDark(savedMode === 'dark');
        }
        const savedTokens = await AsyncStorage.getItem(THEME_TOKENS_KEY);
        if (savedTokens) {
          setCustomColors(JSON.parse(savedTokens));
        }
      } catch (err) {
        console.warn('Error reading cached theme:', err);
      }

      // Sync with server in background
      syncThemeFromServer();
    })();
  }, []);

  const syncThemeFromServer = async () => {
    try {
      const serverTheme = await configService.getTheme();
      if (serverTheme?.colors) {
        const parsedColors: Partial<ColorTokens> = {
          primary: serverTheme.colors.primary,
          secondary: serverTheme.colors.secondary,
          accent: serverTheme.colors.accent,
        };
        setCustomColors(parsedColors);
        await AsyncStorage.setItem(
          THEME_TOKENS_KEY,
          JSON.stringify(parsedColors),
        );
      }
    } catch {
      // Offline fallback: keep using bundled or cached theme
    }
  };

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
    () => createTheme(isDark, customColors),
    [isDark, customColors],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, isDark, toggleDarkMode, syncThemeFromServer }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => useContext(ThemeContext);
