import { defaultApiClient } from './apiClient';

export interface AuthUser {
  id: number;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  address?: string | null;
  pincode?: string | null;
  ration_card_no?: string | null;
  avatar_url?: string | null;
  blood_donor_active?: boolean;
  sms_alerts_active?: boolean;
  district_id?: number | null;
  taluka_id?: number | null;
  village_id?: number | null;
  district?: { id: number; name_en: string; name_gu: string } | null;
  taluka?: { id: number; name_en: string; name_gu: string } | null;
  village?: { id: number; name_en: string; name_gu: string } | null;
  locale?: string;
  occupation?: string | null;
  roles?: string[];
  helper_status?: 'pending' | 'approved' | 'rejected' | null;
  on_duty?: boolean;
  is_active?: boolean;
}

export const authService = {
  async login(identifier: string, password: string) {
    const isEmail = identifier.includes('@');
    return defaultApiClient.post<{
      success: boolean;
      data: { token: string; user: AuthUser };
    }>('/auth/login', {
      identifier,
      email: isEmail ? identifier : undefined,
      phone: !isEmail ? identifier : undefined,
      password,
    });
  },

  async register(payload: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    role?: 'citizen' | 'mentor' | 'volunteer';
    locale?: string;
  }) {
    return defaultApiClient.post<{
      success: boolean;
      message?: string;
      data: { token: string; user: AuthUser };
    }>('/auth/register', payload);
  },

  async requestOtp(payload: {
    email?: string;
    phone?: string;
    identifier?: string;
    purpose?: string;
  }) {
    return defaultApiClient.post<{
      success: boolean;
      message?: string;
      data: { email?: string; phone?: string; debug_code?: string };
    }>('/auth/otp/request', payload);
  },

  async verifyOtp(payload: {
    email?: string;
    phone?: string;
    identifier?: string;
    code: string;
    purpose?: string;
  }) {
    return defaultApiClient.post<{
      success: boolean;
      data: { token: string; user: AuthUser };
    }>('/auth/otp/verify', payload);
  },

  async forgotPassword(email: string) {
    return defaultApiClient.post('/auth/forgot-password', { email });
  },

  async resetPasswordWithOtp(payload: {
    email?: string;
    phone?: string;
    code: string;
    password: string;
    password_confirmation: string;
    purpose?: string;
  }) {
    return defaultApiClient.post<{ success: boolean; message?: string }>(
      '/auth/reset-password',
      payload,
    );
  },

  async updateProfile(payload: Record<string, unknown>) {
    return defaultApiClient.put<{ success: boolean; data: AuthUser }>(
      '/me',
      payload,
    );
  },

  async uploadAvatar(payload: { avatar_base64?: string; avatar?: any }) {
    return defaultApiClient.post<{
      success: boolean;
      message?: string;
      data: { avatar_url: string; user: AuthUser };
    }>('/me/avatar', payload);
  },

  async logout() {
    try {
      await defaultApiClient.post('/auth/logout', {});
    } catch {
      // token may already be invalid
    }
    await defaultApiClient.clearAuthToken();
  },

  async me() {
    return defaultApiClient.get<{ success: boolean; data: AuthUser }>('/me');
  },
};
