import { useState, useEffect } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import ServiceIcon from '@/icons/ServiceIcon';
import { PhoneIconAuto } from '@/icons/ContactIcons';
import { LimelightNav, type LimelightNavItem } from '@/components/ui/limelight-nav';

const NAV_ITEMS = [
  { key: 'nav_about',    anchor: 'about' },
  { key: 'nav_services', anchor: 'services' },
  { key: 'nav_gallery',  anchor: 'gallery' },
  { key: 'nav_reviews',  anchor: 'reviews' },
  { key: 'nav_contact',  anchor: 'contact' },
];

// Simple inline SVG icons for LimelightNav (no extra dep)
const IconAbout = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
const IconServices = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IconGallery = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>;
const IconReviews = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconContact = (p: React.SVGProps<SVGSVGElement>) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.04 6.04l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;

const NAV_ICONS = [IconAbout, IconServices, IconGallery, IconReviews, IconContact];

export default function Header() {
  const { business } = useBusiness();
  const { t, dir, isPrimary, showLangToggle, toggleLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (anchor: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Build LimelightNav items for mobile bottom nav
  const limelightItems: LimelightNavItem[] = NAV_ITEMS.map((item, i) => ({
    id: item.anchor,
    icon: (() => { const Icon = NAV_ICONS[i]; return <Icon />; })(),
    label: t(item.key),
    onClick: () => scrollTo(item.anchor),
  }));

  return (
    <>
      <header
        dir={dir}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group" onClick={(e) => scrollTo('hero', e)} data-edit-logo>
            {business?.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-10 w-auto max-w-[120px] object-contain" />
            ) : (
              <ServiceIcon icon={business?.logo_emoji || 'Home'} size={22} />
            )}
            <div>
              <div className={`font-bold text-lg leading-tight transition-colors ${scrolled ? 'text-blue-700' : 'text-white'}`}>
                {isPrimary ? business?.name : business?.name_en}
              </div>
              <div className={`text-xs transition-colors ${scrolled ? 'text-gray-500' : 'text-white/65'}`}>
                {isPrimary ? business?.category_he : business?.category_en}
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.key}
                href={`#${item.anchor}`}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${scrolled ? 'text-gray-700' : 'text-white'}`}
                onClick={(e) => scrollTo(item.anchor, e)}
              >
                {t(item.key)}
              </a>
            ))}
          </nav>

          {/* Right side: lang + phone */}
          <div className="flex items-center gap-3">
            <a
              href={`tel:${business?.phone}`}
              className={`hidden md:flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full transition-all ${
                scrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <PhoneIconAuto size={14} className="shrink-0" /> {business?.phone_display}
            </a>

            {showLangToggle && (
              <button
                onClick={toggleLang}
                className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-all ${
                  scrolled ? 'border-blue-600 text-blue-600 hover:bg-blue-50' : 'border-white/60 text-white hover:bg-white/10'
                }`}
              >
                {t('lang_toggle')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile LimelightNav — floating bottom bar (137⭐ on 21st.dev) */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <LimelightNav items={limelightItems} defaultActiveIndex={0} />
      </div>
    </>
  );
}
