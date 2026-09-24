export interface Village {
  id: number;
  taluka_id: number;
  name_en: string;
  name_gu: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  census_code?: string;
  is_tribal_majority?: boolean;
  is_active?: boolean;
}

export interface NearestLocationResult {
  village: {
    id: number;
    name_en: string;
    name_gu: string;
    pincode?: string;
    lat: number;
    lng: number;
  };
  taluka: {
    id: number;
    name_en: string;
    name_gu: string;
    code?: string;
  } | null;
  district: {
    id: number;
    name_en: string;
    name_gu: string;
    code?: string;
  } | null;
  distance_km: number;
}

export interface Taluka {
  id: number;
  district_id: number;
  name_en: string;
  name_gu: string;
  code?: string;
  is_active?: boolean;
  villages?: Village[];
}

export interface District {
  id: number;
  name_en: string;
  name_gu: string;
  code?: string;
  is_tribal_majority?: boolean;
  is_active?: boolean;
  talukas?: Taluka[];
}
