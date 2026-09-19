export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'staff'
  | 'mentor'
  | 'volunteer'
  | 'partner'
  | 'citizen';

export interface User {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  roles: UserRole[];
  district_id?: number | null;
  taluka_id?: number | null;
  village_id?: number | null;
  district?: { id: number; name_en: string; name_gu: string } | null;
  locale: string;
  is_active: boolean;
}
