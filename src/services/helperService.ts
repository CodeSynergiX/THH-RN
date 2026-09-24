import { defaultApiClient } from './apiClient';
import { Application } from '../models/application.model';

interface Envelope<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: { current_page?: number; last_page?: number; total?: number };
}

export interface EmergencySosItem {
  id: number;
  patient_name: string;
  blood_group: string;
  hospital_id?: number | null;
  hospital?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
  } | null;
  units_required: number;
  urgency: string;
  status: string;
  contact_phone: string;
  created_at?: string;
}

export interface DeskMetrics {
  assigned_active_cases: number;
  in_progress_cases?: number;
  resolved_cases: number;
  pending_mentor_questions: number;
  follow_ups_due_today: number;
  sla_breached_cases: number;
  awaiting_confirmation?: number;
  urgency?: { urgent?: number; medium?: number; low?: number };
  emergency_sos?: EmergencySosItem[];
  helper_status?: string | null;
  on_duty?: boolean;
}

export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const inner = (payload as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return inner as T[];
    }
  }
  return [];
}

export const helperService = {
  dashboard() {
    return defaultApiClient.get<Envelope<DeskMetrics>>('/helper/dashboard');
  },

  cases(page = 1) {
    return defaultApiClient.get<
      Envelope<Application[] | { data: Application[] }>
    >(`/helper/cases?page=${page}`);
  },

  getEmergencySos() {
    return defaultApiClient.get<Envelope<EmergencySosItem[]>>(
      '/health/blood-requests',
    );
  },

  createEmergencySos(payload: {
    patient_name: string;
    blood_group: string;
    units_required?: number;
    urgency?: string;
    contact_phone: string;
    hospital_id?: number;
  }) {
    return defaultApiClient.post<Envelope<EmergencySosItem>>(
      '/health/blood-requests',
      payload,
    );
  },

  updateEmergencySosStatus(
    id: number,
    status: 'active' | 'fulfilled' | 'cancelled',
  ) {
    return defaultApiClient.post<Envelope<EmergencySosItem>>(
      `/health/blood-requests/${id}/status`,
      { status },
    );
  },

  accept(id: number) {
    return defaultApiClient.post<Envelope<Application>>(
      `/helper/cases/${id}/accept`,
    );
  },

  decline(id: number, reason: string) {
    return defaultApiClient.post<Envelope<null>>(
      `/helper/cases/${id}/decline`,
      {
        reason,
      },
    );
  },

  resolve(id: number, resolutionNote: string) {
    return defaultApiClient.post<Envelope<Application>>(
      `/helper/cases/${id}/resolve`,
      { resolution_note: resolutionNote },
    );
  },

  updateStatus(
    id: number,
    status: string,
    options?: {
      notes?: string;
      note?: string;
      urgency?: string;
      lat?: number;
      lng?: number;
      proof_photo?: string;
    },
  ) {
    return defaultApiClient.post<Envelope<Application>>(
      `/helper/cases/${id}/status`,
      {
        status,
        notes: options?.notes || options?.note,
        note: options?.note || options?.notes,
        urgency: options?.urgency,
        lat: options?.lat,
        lng: options?.lng,
        proof_photo: options?.proof_photo,
        visibility: 'public',
      },
    );
  },

  addNote(id: number, note: string) {
    return defaultApiClient.post(`/helper/cases/${id}/note`, { note });
  },

  setOnDuty(onDuty: boolean) {
    return defaultApiClient.post<
      Envelope<{ on_duty: boolean; helper_status?: string }>
    >('/helper/duty', { on_duty: onDuty });
  },
};
