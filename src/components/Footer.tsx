import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import ServiceIcon from '@/icons/ServiceIcon';
import { PhoneIconAuto, WhatsAppIconAuto } from '@/icons/ContactIcons';
import { buildWhatsappUrl } from '@/lib/whatsapp';
import { TextHoverEffect } from '@/components/ui/text-hover-effect';

const NAV_ITEMS = [
  { key: 'nav_about',    anchor: 'about' },
  { key: 'nav_services', anchor: 'services' },
  { key: 'nav_gallery',  anchor: 'gallery' },
  { key: 'nav_reviews',  anchor: 'reviews' },
  { key: 'nav_contact',  anchor: 'contact' },
];

export default function Footer() {
  const { business } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  const waUrl = buildWhatsappUrl(
    business?.whatsapp || business?.phone,
    t('contact_wa_default_msg'),
  );

  const scrollTo = (anchor: string, e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' });
  };

  const year = new Date().getFullYear();

  return (
    <footer dir={dir} className="bg-gray-900 text-gray-400 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ServiceIcon icon={business?.logo_emoji || 'Home'} size={22} />
              <span className="text-white font-bold text-lg">
                {isPrimary ? business?.name : business?.name_en}
              </span>
            </div>
            <p className="text-sm mb-4">
              {isPrimary ? business?.category_he : business?.category_en}
            </p>
            <div className="flex gap-2">
              <a
                href={`tel:${business?.phone}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <PhoneIconAuto size={14} className="shrink-0" /> {t('contact_call')}
              </a>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <WhatsAppIconAuto size={14} className="shrink-0" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('footer_quick_links')}</h4>
            <ul className="space-y-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.key}>
                  <a
                    href={`#${item.anchor}`}
                    onClick={(e) => scrollTo(item.anchor, e)}
                    className="hover:text-white transition-colors"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-white font-semibold mb-3">{t('contact_title')}</h4>
            {business && (
              <ul className="space-y-2 text-sm">
                <li>
                  <a href={`tel:${business.phone}`} className="hover:text-white transition-colors">
                    <PhoneIconAuto size={14} className="shrink-0" /> {business.phone_display}
                  </a>
                </li>
                <li>
                  <a href={business.maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    📍 {isPrimary ? business.address_he : business.address_en}
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm">
          © {year} {isPrimary ? business?.name : business?.name_en} · {t('footer_rights')}
        </div>

        {/* TextHoverEffect brand name — 411⭐ on 21st.dev */}
        <div className="mt-6 h-20 opacity-30 pointer-events-none select-none">
          <TextHoverEffect
            text={(isPrimary ? business?.name : business?.name_en) ?? ''}
            className="text-gray-500"
          />
        </div>
      </div>
    </footer>
  );
}
