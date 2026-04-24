/**
 * SSR / SSG entry point.
 * Used by scripts/prerender.mjs after `vite build --ssr`.
 * Renders the full app synchronously to HTML string, bypassing any
 * async data fetching (data is injected via `initialData`).
 *
 * NOTE: lazy() + Suspense boundaries resolve to their fallbacks during
 * renderToString — that is intentional; above-fold content (Hero, Header,
 * About, Contact, Footer) is pre-rendered, below-fold sections hydrate
 * client-side.
 */
import { renderToString } from 'react-dom/server';
import { Suspense } from 'react';
import { BusinessProvider } from '@/context/BusinessContext';
import { I18nProvider } from '@/context/I18nContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsappFab from '@/components/WhatsappFab';

// Import below-fold sections statically (no lazy) for full prerender
import Services from '@/components/Services';
import Gallery from '@/components/Gallery';
import Reviews from '@/components/Reviews';
import Location from '@/components/Location';

import type { BusinessJson } from '@/types';

export function render(initialData: BusinessJson): string {
  return renderToString(
    <BusinessProvider initialData={initialData}>
      <I18nProvider>
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
      </I18nProvider>
    </BusinessProvider>,
  );
}
