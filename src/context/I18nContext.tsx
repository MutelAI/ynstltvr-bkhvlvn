import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { I18N_DEFAULTS } from '@/i18nDefaults';

// ─── RTL languages ────────────────────────────────────────────────────────────
const RTL_LANGS = new Set(['he', 'ar', 'fa', 'ur']);

// ─── Context type ─────────────────────────────────────────────────────────────

interface I18nContextValue {
  lang: string;
  dir: 'rtl' | 'ltr';
  isRtl: boolean;
  isPrimary: boolean;
  showLangToggle: boolean;
  t: (key: string, fallback?: string) => string;
  toggleLang: () => void;
  setLang: (lang: string) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  dir: 'ltr',
  isRtl: false,
  isPrimary: false,
  showLangToggle: false,
  t: (key) => key,
  toggleLang: () => undefined,
  setLang: () => undefined,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const { business, translations } = useBusiness();
  const [userLang, setUserLang] = useState<string | null>(null);

  const siteLang = business?.site_lang ?? 'en';
  const lang = userLang ?? siteLang;
  const isRtl = RTL_LANGS.has(lang);
  const dir: 'rtl' | 'ltr' = isRtl ? 'rtl' : 'ltr';
  const isPrimary = lang !== 'en';
  const showLangToggle = 'lang_toggle' in translations;

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const bizEntry = translations[key];
      const defEntry = I18N_DEFAULTS[key];

      const pick = (entry: { he: string; en: string } | undefined): string | null => {
        if (!entry) return null;
        return lang === 'en'
          ? entry.en || entry.he || null
          : entry.he || entry.en || null;
      };

      if (bizEntry) return pick(bizEntry) ?? fallback ?? key;

      if (defEntry) {
        if (lang === 'en' || siteLang !== 'he') {
          return defEntry.en || fallback || key;
        }
        return defEntry.he || defEntry.en || fallback || key;
      }

      return fallback || key;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translations, lang, siteLang]);

  const toggleLang = () => {
    setUserLang((cur) => ((cur ?? siteLang) === 'en' ? siteLang : 'en'));
  };

  const value: I18nContextValue = {
    lang,
    dir,
    isRtl,
    isPrimary,
    showLangToggle,
    t,
    toggleLang,
    setLang: setUserLang,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n() {
  return useContext(I18nContext);
}
