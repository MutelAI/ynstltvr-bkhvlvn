/**
 * PreviewApp — Component gallery for business-web-template-v2
 * Renders all section variants with demo data, with controls for:
 *  - Section selection (sidebar)
 *  - Variant selection (A–M tabs)
 *  - Language toggle (he / en)
 *  - Viewport size (full / desktop / tablet / mobile)
 *
 * Access at: http://localhost:5173/preview.html (during vite dev)
 */
import { useState, lazy, Suspense, useEffect } from 'react';
import { MockBusinessProvider } from './MockBusinessProvider';
import { MOCK_DATA } from './mockData';

// ─── Section / variant config ─────────────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
  emoji: string;
  component: string; // prefix for filename: Hero → HeroA.tsx
  variants: string[];
}

const LETTERS = (n: number) => Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));

const SECTIONS: SectionDef[] = [
  { id: 'nav',      label: 'Header / Nav', emoji: '🧭', component: 'Nav',      variants: LETTERS(8)  },
  { id: 'hero',     label: 'Hero',         emoji: '🦸', component: 'Hero',     variants: LETTERS(14) },
  { id: 'services', label: 'Services',     emoji: '🛠️', component: 'Services', variants: LETTERS(13) },
  { id: 'about',    label: 'About',        emoji: '📋', component: 'About',    variants: LETTERS(13) },
  { id: 'reviews',  label: 'Reviews',      emoji: '⭐', component: 'Reviews',  variants: LETTERS(13) },
  { id: 'gallery',  label: 'Gallery',      emoji: '🖼️', component: 'Gallery',  variants: LETTERS(5)  },
  { id: 'contact',  label: 'Contact',      emoji: '📞', component: 'Contact',  variants: LETTERS(13) },
];

// Short description per variant (from variantPicker VARIANT_TAGS)
const VARIANT_LABELS: Record<string, Record<string, string>> = {
  nav:      { A: 'Glassmorphism', B: 'Dark Elite', C: 'Floating Island', D: 'Two-Tier', E: 'Warm Gradient', F: 'Minimal Elegant', G: 'Sidebar Drawer', H: 'Centered Split' },
  hero:     { A: 'Animated Words', B: 'Diagonal Split', C: 'Glass Layers', D: 'Brutalist', E: 'Split Photo', F: 'Photo Carousel', G: 'Full-Bleed Photo', H: '3D Photo Carousel', I: 'Bento Grid', J: 'Aurora Gradient', K: 'Magazine Editorial', L: 'Tech Dashboard', M: 'Warm Arc', N: 'Review Backdrop' },
  services: { A: 'Horizontal Stacked', B: 'Masonry', C: 'Dark Showcase', D: 'Icon Circles', E: 'Flip Cards', F: 'Numbered Steps', G: 'Zigzag', H: 'Pill Tags', I: 'Feature Grid', J: 'Accordion', K: 'Feature Rows', L: 'Hexagonal', M: 'Minimal Cards' },
  about:    { A: 'Bento Dashboard', B: 'Magazine Split', C: 'Dark Immersive', D: 'Timeline Strip', E: 'Floating Badges', F: 'Infographic Bars', G: 'Card Carousel', H: 'Metric Dials', I: 'Vertical Panels', J: 'Polaroid Mosaic', K: 'Glassmorphism', L: 'Bold Brutalist', M: 'Accordion' },
  reviews:  { A: 'Featured Spotlight', B: 'Masonry Wall', C: 'Chat Bubbles', D: 'Carousel', E: 'Rating Dashboard', F: 'Dark Premium', G: 'Stacked 3D', H: 'Horizontal Scroll', I: 'Timeline Flow', J: 'Bar Chart', K: 'Quote Gallery', L: 'Dark Tiles', M: 'Minimal List' },
  gallery:  { A: 'Masonry/Grid', B: '3D Cylinder', C: 'Infinite Scroll', D: 'Coverflow', E: 'Card Deck' },
  contact:  { A: 'Floating Cards', B: 'Split Screen', C: 'Wave Organic', D: 'Stepped Form', E: 'Glass Overlay', F: 'Dark Professional', G: 'Colorful Blocks', H: 'Minimal Centered', I: 'Elevated Card', J: 'Conversion Hero', K: 'Single Card', L: 'Dark Sidebar', M: 'Tabbed Panel' },
};

// ─── Lazy component cache ─────────────────────────────────────────────────────

const componentCache = new Map<string, React.LazyExoticComponent<() => React.ReactElement>>();

function getVariantComponent(sectionId: string, component: string, variant: string) {
  const key = `${sectionId}-${variant}`;
  if (!componentCache.has(key)) {
    componentCache.set(
      key,
      lazy(() =>
        import(`../component-variants/${sectionId}/${component}${variant}.tsx`).catch(() =>
          ({ default: () => <NotFound sectionId={sectionId} component={component} variant={variant} /> })
        )
      )
    );
  }
  return componentCache.get(key)!;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotFound({ component, variant }: { sectionId: string; component: string; variant: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-3">🚧</div>
        <p className="font-medium">Component not found</p>
        <code className="text-sm opacity-60">{component}{variant}.tsx</code>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Viewport widths ──────────────────────────────────────────────────────────

type Viewport = 'full' | 'desktop' | 'tablet' | 'mobile';

const VIEWPORTS: { id: Viewport; label: string; icon: string; maxWidth: string }[] = [
  { id: 'full',    label: 'Full',    icon: '🖥',  maxWidth: '100%'  },
  { id: 'desktop', label: '1440',    icon: '💻',  maxWidth: '1440px' },
  { id: 'tablet',  label: '768',     icon: '📱',  maxWidth: '768px'  },
  { id: 'mobile',  label: '390',     icon: '📲',  maxWidth: '390px'  },
];

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function PreviewApp() {
  const [activeSectionIdx, setActiveSectionIdx] = useState(1); // Hero by default
  const [activeVariant, setActiveVariant] = useState('A');
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [viewport, setViewport] = useState<Viewport>('full');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const section = SECTIONS[activeSectionIdx];

  // Reset variant to A whenever section changes (only if current variant letter not available)
  useEffect(() => {
    if (!section.variants.includes(activeVariant)) {
      setActiveVariant('A');
    }
  }, [activeSectionIdx]);

  const variantLabel = VARIANT_LABELS[section.id]?.[activeVariant] ?? activeVariant;
  const maxWidth = VIEWPORTS.find(v => v.id === viewport)?.maxWidth ?? '100%';

  const Component = getVariantComponent(section.id, section.component, activeVariant);

  return (
    <div className="flex h-screen bg-[#0f1117] text-gray-200 font-sans overflow-hidden" dir="ltr">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-12'} flex-shrink-0 bg-[#161b22] border-r border-[#21262d] transition-all duration-200 flex flex-col`}>
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-3 border-b border-[#21262d]">
          <button onClick={() => setSidebarOpen(o => !o)} className="text-xl hover:text-white transition-colors w-6 flex-shrink-0">
            {sidebarOpen ? '◀' : '▶'}
          </button>
          {sidebarOpen && <span className="font-bold text-sm text-white truncate">Component Preview</span>}
        </div>

        {/* Section list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setActiveSectionIdx(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${
                idx === activeSectionIdx
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:bg-[#21262d] hover:text-gray-200'
              }`}
            >
              <span className="text-base w-5 flex-shrink-0 text-center">{s.emoji}</span>
              {sidebarOpen && (
                <span className="font-medium truncate">{s.label}</span>
              )}
              {sidebarOpen && (
                <span className={`ms-auto text-xs flex-shrink-0 px-1.5 py-0.5 rounded ${
                  idx === activeSectionIdx ? 'bg-blue-500/20 text-blue-300' : 'bg-[#21262d] text-gray-500'
                }`}>
                  {s.variants.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[#21262d] text-xs text-gray-600">
            business-web-template-v2
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <header className="h-14 bg-[#161b22] border-b border-[#21262d] flex items-center gap-3 px-4 flex-shrink-0">
          {/* Section name */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{section.emoji}</span>
            <span className="font-bold text-white">{section.label}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-blue-400 text-sm font-medium">{activeVariant} – {variantLabel}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Viewport selector */}
          <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
            {VIEWPORTS.map(v => (
              <button
                key={v.id}
                onClick={() => setViewport(v.id)}
                title={v.label}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-all ${
                  viewport === v.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#30363d]'
                }`}
              >
                {v.icon} {v.label !== 'Full' && v.label}
              </button>
            ))}
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-1 bg-[#21262d] rounded-lg p-1">
            {(['he', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all uppercase ${
                  lang === l ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#30363d]'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </header>

        {/* ── Variant tabs ───────────────────────────────────────────────── */}
        <div className="bg-[#161b22] border-b border-[#21262d] flex items-center gap-1 px-4 py-2 overflow-x-auto flex-shrink-0">
          {section.variants.map(v => {
            const label = VARIANT_LABELS[section.id]?.[v] ?? v;
            return (
              <button
                key={v}
                onClick={() => setActiveVariant(v)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  v === activeVariant
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-gray-400 hover:bg-[#21262d] hover:text-gray-200 border border-[#30363d]'
                }`}
              >
                <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-black ${v === activeVariant ? 'bg-white/20' : 'bg-[#21262d]'}`}>
                  {v}
                </span>
                <span className="max-w-24 truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Component canvas ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-[#0d1117]">
          <div
            className="mx-auto transition-all duration-300"
            style={{ maxWidth }}
          >
            {/* Subtle device frame for non-full viewports */}
            {viewport !== 'full' && (
              <div className="mx-auto bg-white shadow-2xl shadow-black/60" style={{ maxWidth }}>
                <MockBusinessProvider data={MOCK_DATA} lang={lang} key={lang}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Component />
                  </Suspense>
                </MockBusinessProvider>
              </div>
            )}
            {viewport === 'full' && (
              <MockBusinessProvider data={MOCK_DATA} lang={lang} key={lang}>
                <Suspense fallback={<LoadingSpinner />}>
                  <Component />
                </Suspense>
              </MockBusinessProvider>
            )}
          </div>
        </div>

        {/* ── Status bar ─────────────────────────────────────────────────── */}
        <footer className="h-7 bg-blue-700 flex items-center gap-4 px-4 text-xs text-blue-100 flex-shrink-0">
          <span>{section.id}/{section.component}{activeVariant}.tsx</span>
          <span>·</span>
          <span>{lang === 'he' ? 'עברית (RTL)' : 'English (LTR)'}</span>
          <span>·</span>
          <span>viewport: {maxWidth}</span>
          <span className="ms-auto">{section.variants.indexOf(activeVariant) + 1} / {section.variants.length}</span>
        </footer>
      </div>
    </div>
  );
}
