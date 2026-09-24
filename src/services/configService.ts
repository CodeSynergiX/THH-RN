import { defaultApiClient } from './apiClient';
import { TranslationsDictionary } from '../i18n/translations';
import { WorkflowStage } from '../models/application.model';

export interface RemoteBranding {
  name?: string;
  name_en?: string;
  name_gu?: string;
  name_short?: string;
  name_short_en?: string;
  name_short_gu?: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  helpline?: string;
  support_email?: string;
}

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
  branding?: RemoteBranding;
  light?: Record<string, string>;
  dark?: Record<string, string>;
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

  async getModules(locale = 'gu') {
    const res = await defaultApiClient.get<{
      success: boolean;
      data: Array<{
        key: string;
        slug: string;
        title: string;
        title_en?: string;
        title_gu?: string;
        subtitle?: string;
        icon?: string;
        accent_color?: string;
        show_apply_form?: boolean;
        count?: number;
      }>;
    }>(`/config/home-tiles?locale=${locale}`);
    return Array.isArray(res.data) ? res.data : [];
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

  async getWorkflowStages(status?: string): Promise<WorkflowStage[]> {
    try {
      const url = status
        ? `/config/workflow-stages?status=${encodeURIComponent(status)}`
        : '/config/workflow-stages';
      const res = await defaultApiClient.get<{
        success: boolean;
        data: WorkflowStage[];
      }>(url);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }
}

export const configService = new ConfigService();
