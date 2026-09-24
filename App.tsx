import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useTranslation } from './src/i18n/LanguageContext';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { MainNavigator } from './src/views/MainNavigator';

function ThemedApp() {
  const { isDark } = useAppTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      (StatusBar as any).setTranslucent?.(true);
      (StatusBar as any).setBackgroundColor?.('transparent', true);
    }
  }, []);

  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <MainNavigator />
    </>
  );
}

/** Bridge: reads the current locale from LanguageContext and passes it into ThemeProvider */
function LocaleAwareThemeProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation();
  return <ThemeProvider locale={locale}>{children}</ThemeProvider>;
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      {/* LanguageProvider MUST be outermost so LocaleAwareThemeProvider can consume it */}
      <LanguageProvider>
        <LocaleAwareThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ThemedApp />
            </ToastProvider>
          </AuthProvider>
        </LocaleAwareThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
