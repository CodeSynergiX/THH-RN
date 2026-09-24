export type ApplicationStatus =
  | 'received'
  | 'verification'
  | 'categorised'
  | 'assigned'
  | 'assistance'
  | 'follow_up'
  | 'followUp'
  | 'awaiting_confirmation'
  | 'resolved'
  | 'solved'
  | 'field_visit_completed'
  | 'in_verification'
  | 'awaiting_docs'
  | 'approved'
  | 'closed'
  | 'rejected'
  | 'on_hold'
  | 'onHold'
  | 'reopened'
  | 'needMoreInfo';

export type ApplicationUrgency = 'low' | 'medium' | 'urgent';
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

export interface WorkflowStage {
  key: string;
  name_en: string;
  name_gu: string;
  headline_en?: string;
  headline_gu?: string;
  desc_en?: string;
  desc_gu?: string;
  icon?: string;
}

export interface Application {
  id: number;
  case_no: string;
  title: string;
  description: string;
  module?: string;
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
  lat?: number | null;
  lng?: number | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  beneficiary_name?: string | null;
  beneficiary_phone?: string | null;
  user?: {
    id?: number;
    name?: string;
    phone?: string;
    email?: string;
  };
  current_assignee?: {
    id: number;
    name: string;
    phone?: string | null;
    email?: string | null;
    role?: string | null;
    helper_status?: string | null;
  } | null;
  sla_due_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  timeline_events?: TimelineEvent[];
  timeline?: TimelineEvent[];
  documents?: ApplicationDocument[];
  workflow_stages?: WorkflowStage[];
}

export interface CreateApplicationPayload {
  category_id?: number;
  module?: string;
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
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  idempotency_key?: string;
  documents?: Array<{
    document_type: string;
    file_path: string;
    original_name?: string;
    mime_type?: string;
    base64?: string;
    size?: string;
    name?: string;
    uri?: string;
    type?: string;
    path?: string;
  }>;
}

