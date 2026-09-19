import { defaultApiClient } from './apiClient';
import { TranslationsDictionary } from '../i18n/translations';

export interface RemoteThemeResponse {
  version: number;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

export interface RemoteTranslationsResponse {
  locale: string;
  count: number;
  translations: TranslationsDictionary;
}

export class ConfigService {
  async getTheme(): Promise<RemoteThemeResponse | null> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: RemoteThemeResponse;
      }>('/config/theme');
      return res.data;
    } catch {
      return null;
    }
  }

  async getTranslations(
    locale: string = 'gu',
  ): Promise<TranslationsDictionary | null> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: RemoteTranslationsResponse;
      }>(`/config/translations?locale=${locale}`);
      return res.data?.translations || null;
    } catch {
      return null;
    }
  }
}

export const configService = new ConfigService();
