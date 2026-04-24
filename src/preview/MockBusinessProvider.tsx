/**
 * MockBusinessProvider — injects static mock data into BusinessContext
 * and wraps with I18nProvider. Used only by the preview app.
 */
import type { ReactNode } from 'react';
import { I18nProvider } from '@/context/I18nContext';
import { BusinessContext } from '@/context/BusinessContext';
import type { BusinessJson, DesignTokens } from '@/types';

const DEFAULT_DESIGN: DesignTokens = {
  hero_layout: 'centered',
  card_style: 'shadow',
  button_style: 'rounded',
  hero_pattern: 'circles',
  gallery_style: 'masonry',
  section_style: 'standard',
  animation_style: 'elegant',
};

interface Props {
  data: BusinessJson;
  lang: 'he' | 'en';
  children: ReactNode;
}

export function MockBusinessProvider({ data, lang, children }: Props) {
  const business = data.business ? { ...data.business, site_lang: lang } : null;

  const value = {
    business,
    hours: data.hours ?? [],
    services: data.services ?? [],
    reviews: data.reviews ?? [],
    photos: data.photos ?? [],
    translations: data.translations ?? {},
    design: { ...DEFAULT_DESIGN, ...(data.design ?? {}) },
    loaded: true,
    hiddenSections: data.hidden_sections ?? [],
    isHidden: (key: string) => (data.hidden_sections ?? []).includes(key),
  };

  return (
    <BusinessContext.Provider value={value}>
      <I18nProvider>{children}</I18nProvider>
    </BusinessContext.Provider>
  );
}
