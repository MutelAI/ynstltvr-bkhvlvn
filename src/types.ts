// ─── Business data types (mirrors business-data.service.ts) ────────────────

export interface BusinessInfo {
  name: string;
  name_en: string;
  site_lang: string;
  phone: string;
  phone_display: string;
  whatsapp?: string;
  website: string;
  rating: number;
  reviews_count: number;
  address_he: string;
  address_en: string;
  category_he: string;
  category_en: string;
  maps_url: string;
  thumbnail: string;
  logo_emoji: string;
  logo_url?: string;
  geo: { latitude: number; longitude: number };
  schema_type: string;
  price_range: string;
  full_address?: string;
}

export interface WorkingHour {
  day_key: string;
  day_he: string;
  day_en: string;
  hours_he: string;
  hours_en: string;
  is_open: boolean;
}

export interface ServiceItem {
  id: string;
  icon: string;
  title_he: string;
  title_en: string;
  desc_he: string;
  desc_en: string;
}

export interface Review {
  author: string;
  rating: number;
  text_he: string;
  text_en: string;
  date: string;
  iso_date?: string;
  is_local_guide: boolean;
}

export interface Photo {
  url: string;
  thumb: string;
  source: string;
  alt_he: string;
  alt_en: string;
}

export interface DesignTokens {
  hero_layout: string;
  card_style: string;
  button_style: string;
  hero_pattern: string;
  gallery_style: string;
  section_style: string;
  animation_style: string;
}

export interface BusinessJson {
  business: BusinessInfo;
  hours: WorkingHour[];
  services: ServiceItem[];
  reviews: Review[];
  photos: Photo[];
  translations: Record<string, { he: string; en: string }>;
  design?: DesignTokens;
  hidden_sections?: string[];
}
