import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  guTranslations,
  enTranslations,
  TranslationsDictionary,
} from './translations';
import { configService } from '../services/configService';

type SupportedLocale = 'gu' | 'en';

interface LanguageContextType {
  locale: SupportedLocale;
  t: (
    key: string,
    fallback?: string,
    params?: Record<string, string | number>,
  ) => string;
  switchLanguage: (newLocale: SupportedLocale) => Promise<void>;
  supportedLocales: Array<{
    code: SupportedLocale;
    label: string;
    nativeLabel: string;
  }>;
  syncTranslationsFromServer: () => Promise<void>;
}

const LOCALE_KEY = '@thh_active_locale';
const TRANSLATIONS_CACHE_PREFIX = '@thh_trans_cache_';

const LanguageContext = createContext<LanguageContextType>({
  locale: 'gu',
  t: (_key, fallback) => fallback || _key,
  switchLanguage: async () => {},
  supportedLocales: [
    { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
  ],
  syncTranslationsFromServer: async () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocale] = useState<SupportedLocale>('gu');
  const [remoteTranslations, setRemoteTranslations] = useState<
    Record<string, TranslationsDictionary>
  >({
    gu: {},
    en: {},
  });

  const supportedLocales: Array<{
    code: SupportedLocale;
    label: string;
    nativeLabel: string;
  }> = [
    { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
    { code: 'en', label: 'English', nativeLabel: 'English' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const savedLocale = (await AsyncStorage.getItem(
          LOCALE_KEY,
        )) as SupportedLocale;
        if (savedLocale === 'gu' || savedLocale === 'en') {
          setLocale(savedLocale);
        }

        // Read cached remote strings
        const cachedGu = await AsyncStorage.getItem(
          `${TRANSLATIONS_CACHE_PREFIX}gu`,
        );
        const cachedEn = await AsyncStorage.getItem(
          `${TRANSLATIONS_CACHE_PREFIX}en`,
        );

        setRemoteTranslations({
          gu: cachedGu ? JSON.parse(cachedGu) : {},
          en: cachedEn ? JSON.parse(cachedEn) : {},
        });
      } catch (err) {
        console.warn('Error reading cached language:', err);
      }

      // Sync latest translations in background
      syncTranslationsFromServer();
    })();
  }, []);

  const syncTranslationsFromServer = async () => {
    try {
      const guRemote = await configService.getTranslations('gu');
      const enRemote = await configService.getTranslations('en');

      if (guRemote && Object.keys(guRemote).length > 0) {
        setRemoteTranslations(prev => ({ ...prev, gu: guRemote }));
        await AsyncStorage.setItem(
          `${TRANSLATIONS_CACHE_PREFIX}gu`,
          JSON.stringify(guRemote),
        );
      }

      if (enRemote && Object.keys(enRemote).length > 0) {
        setRemoteTranslations(prev => ({ ...prev, en: enRemote }));
        await AsyncStorage.setItem(
          `${TRANSLATIONS_CACHE_PREFIX}en`,
          JSON.stringify(enRemote),
        );
      }
    } catch {
      // Offline fallback: rely on built-in bundle
    }
  };

  const switchLanguage = async (newLocale: SupportedLocale) => {
    setLocale(newLocale);
    try {
      await AsyncStorage.setItem(LOCALE_KEY, newLocale);
    } catch (err) {
      console.warn('Failed to persist language choice:', err);
    }
  };

  const t = (
    key: string,
    fallback?: string,
    params?: Record<string, string | number>,
  ): string => {
    const activeRemote = remoteTranslations[locale] || {};
    const activeLocal = locale === 'gu' ? guTranslations : enTranslations;

    let text = activeRemote[key] || activeLocal[key] || fallback || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        t,
        switchLanguage,
        supportedLocales,
        syncTranslationsFromServer,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType =>
  useContext(LanguageContext);
