import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultApiClient } from './apiClient';
import {
  Application,
  CreateApplicationPayload,
} from '../models/application.model';

const CACHED_APPLICATIONS_KEY = '@thh_cached_applications';

export interface DashboardStats {
  total: number;
  verification: number;
  assistance: number;
  resolved: number;
  rating?: number | null;
}

export class ApplicationService {
  /**
   * Get cached applications synchronously/instantly from AsyncStorage.
   */
  async getCachedApplications(): Promise<Application[]> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_APPLICATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  }

  /**
   * Submit a new help request.
   */
  async createApplication(
    payload: CreateApplicationPayload,
  ): Promise<Application> {
    const idempotencyKey =
      payload.idempotency_key ||
      `REQ_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const res = await defaultApiClient.post<{
      success: boolean;
      data: Application;
    }>(
      '/applications',
      {
        ...payload,
        idempotency_key: idempotencyKey,
      },
      { idempotencyKey },
    );
    return res.data;
  }

  /**
   * Upload an application document or image (base64 or multipart).
   */
  async uploadFile(payload: {
    file_base64?: string;
    file_name?: string;
    type?: string;
  }) {
    return defaultApiClient.post<{
      success: boolean;
      message?: string;
      data: {
        path: string;
        url: string;
        name: string;
        size: number;
        mime_type: string;
      };
    }>('/uploads', payload);
  }

  /**
   * Track application by Case Number (e.g. THH-2026-00001).
   */
  async trackApplication(
    caseNo: string,
    otp?: string,
  ): Promise<Application | null> {
    try {
      const cleanCaseNo = encodeURIComponent(caseNo.trim());
      const suffix = otp ? `?otp=${encodeURIComponent(otp)}` : '';
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Application;
      }>(`/applications/track/${cleanCaseNo}${suffix}`);
      return res.data || null;
    } catch {
      return null;
    }
  }

  async requestTrackOtp(caseNo: string) {
    return defaultApiClient.post<{
      success: boolean;
      data?: { email_hint?: string; debug_code?: string };
      message?: string;
    }>('/applications/track/otp', { case_no: caseNo });
  }

  /**
   * Fetch user's submitted applications with robust multi-shape response handling and cache fallback.
   */
  async getMyApplications(): Promise<Application[]> {
    try {
      const res = await defaultApiClient.get<any>('/applications');
      let list: Application[] = [];

      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      } else if (res?.data && Array.isArray(res.data.data)) {
        list = res.data.data;
      } else if (res && Array.isArray(res.applications)) {
        list = res.applications;
      } else if (res && Array.isArray(res.items)) {
        list = res.items;
      }

      if (list.length > 0) {
        AsyncStorage.setItem(
          CACHED_APPLICATIONS_KEY,
          JSON.stringify(list),
        ).catch(() => {});
        return list;
      }

      // If server genuinely returned 0 items, update cache
      if (res && (res.success === true || Array.isArray(res.data))) {
        AsyncStorage.setItem(CACHED_APPLICATIONS_KEY, JSON.stringify([])).catch(
          () => {},
        );
        return [];
      }

      // Fallback to cache if response was empty/unrecognized
      return await this.getCachedApplications();
    } catch (err) {
      console.warn(
        'Network error fetching applications, using cache fallback:',
        err,
      );
      return await this.getCachedApplications();
    }
  }

  async getQueue(filters?: {
    urgency?: string;
    status?: string;
    page?: number;
  }): Promise<Application[]> {
    const params = new URLSearchParams();
    if (filters?.urgency && filters.urgency !== 'all') {
      params.set('urgency', filters.urgency);
    }
    if (filters?.status) {
      params.set('status', filters.status);
    }
    if (filters?.page) {
      params.set('page', String(filters.page));
    }
    const qs = params.toString();
    const res = await defaultApiClient.get<{
      success: boolean;
      data: Application[] | { data: Application[] };
    }>(`/applications${qs ? `?${qs}` : ''}`);
    if (Array.isArray(res.data)) {
      return res.data;
    }
    if (
      res.data &&
      Array.isArray((res.data as { data?: Application[] }).data)
    ) {
      return (res.data as { data: Application[] }).data;
    }
    return [];
  }

  async confirm(id: number) {
    return defaultApiClient.post(`/applications/${id}/confirm`);
  }

  async reopen(id: number, reason: string) {
    return defaultApiClient.post(`/applications/${id}/reopen`, { reason });
  }

  async getAppointments() {
    return defaultApiClient.get<{
      success: boolean;
      data: { data?: AppointmentRow[] } | AppointmentRow[];
    }>('/appointments');
  }

  /**
   * Fetch single application detail with timeline.
   */
  async getApplicationById(id: number): Promise<Application | null> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Application;
      }>(`/applications/${id}`);
      return res.data || null;
    } catch {
      return null;
    }
  }

  async getTimeline(id: number) {
    return defaultApiClient.get<{
      success: boolean;
      data: Application['timeline_events'];
    }>(`/applications/${id}/timeline`);
  }

  async uploadDocument(
    id: number,
    file: { uri: string; name: string; type: string },
    type = 'supporting',
  ) {
    const form = new FormData();
    form.append('type', type);
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
    return defaultApiClient.postForm(`/applications/${id}/documents`, form);
  }

  /**
   * Fetch public dashboard stats.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data?: {
          metrics: {
            total_cases: number;
            in_verification: number;
            in_assistance: number;
            resolved: number;
            avg_rating?: number;
          };
        };
      }>('/config/home-tiles');

      if (res.data?.metrics) {
        return {
          total: res.data.metrics.total_cases,
          verification: res.data.metrics.in_verification,
          assistance: res.data.metrics.in_assistance,
          resolved: res.data.metrics.resolved,
          rating: res.data.metrics.avg_rating,
        };
      }
    } catch {
      // Fallback
    }

    return {
      total: 0,
      verification: 0,
      assistance: 0,
      resolved: 0,
      rating: null,
    };
  }
}

export const applicationService = new ApplicationService();

export interface AppointmentRow {
  id: number;
  scheduled_for: string;
  status: string;
  notes?: string | null;
  application?: {
    id: number;
    case_no: string;
    title: string;
    status?: string;
    user_id?: number;
  };
  assignee?: { id: number; name: string } | null;
}
