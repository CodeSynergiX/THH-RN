import { defaultApiClient } from './apiClient';
import {
  Application,
  CreateApplicationPayload,
} from '../models/application.model';

export interface DashboardStats {
  total: number;
  verification: number;
  assistance: number;
  resolved: number;
  rating?: number | null;
}

export class ApplicationService {
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
   * Track application by Case Number (e.g. THH-2026-00001).
   */
  async trackApplication(caseNo: string): Promise<Application | null> {
    try {
      const cleanCaseNo = encodeURIComponent(caseNo.trim());
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Application;
      }>(`/applications/track/${cleanCaseNo}`);
      return res.data || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch user's submitted applications.
   */
  async getMyApplications(): Promise<Application[]> {
    try {
      const res = await defaultApiClient.get<{
        success: boolean;
        data: Application[];
      }>('/applications');
      return res.data || [];
    } catch {
      return [];
    }
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
