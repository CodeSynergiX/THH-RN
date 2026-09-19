export interface SubCategory {
  id: number;
  category_id: number;
  slug: string;
  name_en?: string;
  name_gu?: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  slug: string;
  icon?: string;
  name_en?: string;
  name_gu?: string;
  is_active: boolean;
  sub_categories?: SubCategory[];
}
