/**
 * Notification Service — wraps all /api/v1/notifications endpoints.
 * Uses the default API client for authenticated requests.
 */
import { defaultApiClient } from './apiClient';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  id: number;
  user_id: number;
  email_enabled: boolean;
  push_enabled: boolean;
  email_case_status_change: boolean;
  email_assignment: boolean;
  email_follow_up_due: boolean;
  email_sla_breach: boolean;
  email_case_resolved: boolean;
  push_case_status_change: boolean;
  push_assignment: boolean;
  push_follow_up_due: boolean;
  push_sla_breach: boolean;
  push_case_resolved: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface PaginatedNotifications {
  data: NotificationItem[];
  current_page: number;
  last_page: number;
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  unread_count?: number;
}

export const notificationService = {
  async getNotifications(
    page = 1,
  ): Promise<ApiResponse<PaginatedNotifications> & { unread_count: number }> {
    return defaultApiClient.get(`/notifications?page=${page}`);
  },

  async markRead(id: number): Promise<ApiResponse<null>> {
    return defaultApiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<ApiResponse<null>> {
    return defaultApiClient.post('/notifications/read-all');
  },

  async receipt(
    notificationId: number,
    status: 'delivered' | 'opened',
  ): Promise<ApiResponse<null>> {
    return defaultApiClient.post('/notifications/receipt', {
      notification_id: notificationId,
      status,
    });
  },

  async getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return defaultApiClient.get('/notification-preferences');
  },

  async updatePreferences(
    prefs: Partial<Omit<NotificationPreferences, 'id' | 'user_id'>>,
  ): Promise<ApiResponse<NotificationPreferences>> {
    // Use PUT — need to extend apiClient or use post with method override
    return defaultApiClient.put<ApiResponse<NotificationPreferences>>(
      '/notification-preferences',
      prefs,
    );
  },
};
