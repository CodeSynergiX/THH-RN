export type ApplicationStatus =
  | 'received'
  | 'verification'
  | 'categorised'
  | 'assigned'
  | 'assistance'
  | 'follow_up'
  | 'resolved'
  | 'rejected'
  | 'on_hold'
  | 'reopened';

export type ApplicationUrgency = 'normal' | 'urgent' | 'critical';
export type ApplicationPriority = 'low' | 'medium' | 'high';

export interface TimelineEvent {
  id: number;
  application_id: number;
  event_type: string;
  from_status?: string | null;
  to_status?: string | null;
  title_key?: string | null;
  body?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  visibility: 'public' | 'internal';
  created_at: string;
}

export interface ApplicationDocument {
  id: number;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_verified?: boolean;
}

export interface Application {
  id: number;
  case_no: string;
  title: string;
  description: string;
  status: ApplicationStatus;
  urgency: ApplicationUrgency;
  priority: ApplicationPriority;
  category_id: number;
  sub_category_id?: number | null;
  category?: {
    id: number;
    slug: string;
    icon?: string;
    name_gu?: string;
    name_en?: string;
  };
  district?: {
    id: number;
    name_en: string;
    name_gu: string;
  };
  taluka?: {
    id: number;
    name_en: string;
    name_gu: string;
  };
  village?: {
    id: number;
    name_en: string;
    name_gu: string;
  };
  sla_due_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  timeline_events?: TimelineEvent[];
  documents?: ApplicationDocument[];
}

export interface CreateApplicationPayload {
  category_id: number;
  sub_category_id?: number | null;
  title: string;
  description: string;
  urgency: ApplicationUrgency;
  district_id?: number | null;
  taluka_id?: number | null;
  village_id?: number | null;
  lat?: number | null;
  lng?: number | null;
  // Helper mode: on behalf of another citizen
  is_helper_mode?: boolean;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  idempotency_key?: string;
}
