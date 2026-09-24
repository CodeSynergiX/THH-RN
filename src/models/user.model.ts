export interface User {
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
  roles: string[];
  district_id?: number | null;
  taluka_id?: number | null;
  village_id?: number | null;
  district?: { id: number; name_en: string; name_gu: string } | null;
  taluka?: { id: number; name_en: string; name_gu: string } | null;
  village?: { id: number; name_en: string; name_gu: string } | null;
  locale: string;
  is_active: boolean;
  helper_status?: 'pending' | 'approved' | 'rejected' | null;
  on_duty?: boolean;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'staff'
  | 'collector'
  | 'mentor'
  | 'volunteer'
  | 'partner'
  | 'citizen';
