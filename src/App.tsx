import { useEffect, lazy, Suspense } from 'react';
import { BusinessProvider, useBusiness } from '@/context/BusinessContext';
import { I18nProvider, useI18n } from '@/context/I18nContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Footer from '@/components/Footer';
import WhatsappFab from '@/components/WhatsappFab';

// Lazy-load below-fold sections for performance
const Services  = lazy(() => import('@/components/Services'));
const Gallery   = lazy(() => import('@/components/Gallery'));
const Reviews   = lazy(() => import('@/components/Reviews'));
const Contact   = lazy(() => import('@/components/Contact'));
const Location  = lazy(() => import('@/components/Location'));

export default function App() {
  return (
    <BusinessProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </BusinessProvider>
  );
}

function AppContent() {
  const { business, hours, reviews, services, loaded } = useBusiness();
  const { lang, dir } = useI18n();

  // Sync lang/dir to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }, [lang, dir]);

  // ── Comprehensive SEO meta tags ──────────────────────────────────────────
  useEffect(() => {
    if (!business) return;

    // Basic meta
    document.title = business.name;
    setMeta('name', 'description', `${business.name} – ${business.category_he || business.category_en} | ${business.address_he || business.address_en}`);

    // Canonical URL
    setLink('canonical', window.location.origin + window.location.pathname);

    // ── Open Graph ─────────────────────────────────────────────────────────
    setMeta('property', 'og:type', 'business.business');
    setMeta('property', 'og:title', business.name);
    setMeta('property', 'og:description', `${business.name} – ${business.category_he || business.category_en}`);
    setMeta('property', 'og:image', business.thumbnail || business.logo_url || '');
    setMeta('property', 'og:url', window.location.origin);
    setMeta('property', 'og:site_name', business.name);
    setMeta('property', 'og:locale', langToLocale(lang));
    if (business.phone) {
      setMeta('property', 'og:phone_number', business.phone);
    }

    // ── Twitter Card ───────────────────────────────────────────────────────
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', business.name);
    setMeta('name', 'twitter:description', `${business.name} – ${business.category_he || business.category_en}`);
    if (business.thumbnail || business.logo_url) {
      setMeta('name', 'twitter:image', business.thumbnail || business.logo_url || '');
    }

    // ── GEO meta tags (for GEO optimization) ──────────────────────────────
    if (business.geo?.latitude && business.geo?.longitude) {
      setMeta('name', 'geo.position', `${business.geo.latitude};${business.geo.longitude}`);
      setMeta('name', 'geo.placename', business.address_he || business.address_en);
      setMeta('name', 'ICBM', `${business.geo.latitude}, ${business.geo.longitude}`);
    }
    if (business.address_he || business.address_en) {
      setMeta('name', 'geo.region', extractRegion(business.address_en || business.address_he));
    }

    // ── Additional SEO meta ───────────────────────────────────────────────
    setMeta('name', 'author', business.name);
    setMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');
    setMeta('name', 'format-detection', 'telephone=yes');
    if (business.category_he || business.category_en) {
      setMeta('name', 'keywords', [
        business.category_he, business.category_en,
        business.name, business.name_en,
        business.address_he, business.address_en,
      ].filter(Boolean).join(', '));
    }
  }, [business, lang]);

  // ── JSON-LD Structured Data (comprehensive) ────────────────────────────
  useEffect(() => {
    if (!business || !loaded) return;

    // ── Main LocalBusiness schema ──────────────────────────────────────────
    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': business.schema_type || 'LocalBusiness',
      name: business.name,
      url: window.location.origin,
      telephone: business.phone,
      image: business.thumbnail || business.logo_url || undefined,
      priceRange: business.price_range || undefined,
    };

    // Alternate name
    if (business.name_en && business.name_en !== business.name) {
      jsonLd.alternateName = business.name_en;
    }

    // Address
    if (business.address_en || business.address_he) {
      jsonLd.address = {
        '@type': 'PostalAddress',
        streetAddress: business.address_en || business.address_he,
      };
    }

    // Geo coordinates
    if (business.geo?.latitude && business.geo?.longitude) {
      jsonLd.geo = {
        '@type': 'GeoCoordinates',
        latitude: business.geo.latitude,
        longitude: business.geo.longitude,
      };
      jsonLd.hasMap = business.maps_url || `https://maps.google.com/?q=${business.geo.latitude},${business.geo.longitude}`;
    }

    // Aggregate rating
    if (business.rating && business.reviews_count) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: business.rating,
        bestRating: 5,
        worstRating: 1,
        reviewCount: business.reviews_count,
      };
    }

    // Individual reviews
    if (reviews.length > 0) {
      jsonLd.review = reviews.map(r => ({
        '@type': 'Review',
        author: { '@type': 'Person', name: r.author },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
          bestRating: 5,
          worstRating: 1,
        },
        reviewBody: r.text_he || r.text_en,
        datePublished: r.date || undefined,
      }));
    }

    // Opening hours
    if (hours.length > 0) {
      const dayMap: Record<string, string> = {
        sunday: 'Su', monday: 'Mo', tuesday: 'Tu', wednesday: 'We',
        thursday: 'Th', friday: 'Fr', saturday: 'Sa',
      };
      const openingHours = hours
        .filter(h => h.is_open)
        .map(h => {
          const dayAbbr = dayMap[h.day_key] || '';
          const timeMatch = (h.hours_en || h.hours_he || '').match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
          if (dayAbbr && timeMatch) {
            return `${dayAbbr} ${timeMatch[1]}-${timeMatch[2]}`;
          }
          if (dayAbbr && /24\s*hours|open/i.test(h.hours_en || h.hours_he || '')) {
            return `${dayAbbr} 00:00-23:59`;
          }
          return null;
        })
        .filter(Boolean);

      if (openingHours.length > 0) {
        jsonLd.openingHours = openingHours;
      }
    }

    // Services as offers
    if (services.length > 0) {
      jsonLd.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: business.category_he || business.category_en || 'Services',
        itemListElement: services.map(s => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: s.title_he || s.title_en,
            description: s.desc_he || s.desc_en,
          },
        })),
      };
    }

    setJsonLd('json-ld-main', jsonLd);

    // ── WebSite schema (for sitelinks search box) ─────────────────────────
    setJsonLd('json-ld-website', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: business.name,
      url: window.location.origin,
    });

    // ── BreadcrumbList schema ──────────────────────────────────────────────
    setJsonLd('json-ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: business.name,
          item: window.location.origin,
        },
      ],
    });
  }, [business, hours, reviews, services, loaded]);

  // ── Edit mode bootstrap ────────────────────────────────────────────────
  useEffect(() => {
    const token = window.__editToken;
    if (token && loaded) {
      import('@/edit/edit-module').then(({ initEditMode }) => {
        initEditMode(token);
      });
    }
  }, [loaded]);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <Services />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <Gallery />
        </Suspense>
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <Reviews />
        </Suspense>
        <Contact />
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <Location />
        </Suspense>
      </main>
      <Footer />
      <WhatsappFab />
    </>
  );
}

// ── SEO Helpers ──────────────────────────────────────────────────────────────

function setMeta(attr: string, value: string, content: string) {
  if (!content) return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  if (!href) return;
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(id: string, data: Record<string, any>) {
  const script = document.getElementById(id) ?? document.createElement('script');
  script.id = id;
  (script as HTMLScriptElement).type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  if (!script.parentElement) document.head.appendChild(script);
}

/** Convert lang code to OG locale format (e.g. 'he' → 'he_IL', 'en' → 'en_US') */
function langToLocale(lang: string): string {
  const map: Record<string, string> = {
    he: 'he_IL', en: 'en_US', ar: 'ar_SA', hu: 'hu_HU', fr: 'fr_FR',
    de: 'de_DE', es: 'es_ES', it: 'it_IT', nl: 'nl_NL', pl: 'pl_PL',
    pt: 'pt_BR', ru: 'ru_RU', tr: 'tr_TR', ja: 'ja_JP', zh: 'zh_CN',
    ko: 'ko_KR', cs: 'cs_CZ', ro: 'ro_RO', el: 'el_GR', sv: 'sv_SE',
    no: 'no_NO', da: 'da_DK', fi: 'fi_FI', uk: 'uk_UA',
  };
  return map[lang] || `${lang}_${lang.toUpperCase()}`;
}

/** Extract region code from address for geo.region meta tag */
function extractRegion(address: string): string {
  if (!address) return '';
  const parts = address.split(',').map(s => s.trim());
  return parts[parts.length - 1] || '';
}
