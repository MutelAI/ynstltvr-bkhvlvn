import { useMemo } from 'react';
import { motion } from 'motion/react';
import { PhoneIconAuto } from '@/icons/ContactIcons';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';

export default function Location() {
  const { business, isHidden } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  const mapUrl = useMemo(() => {
    if (!business?.geo) return null;
    const q = encodeURIComponent(`${business.geo.latitude},${business.geo.longitude}`);
    return `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
  }, [business?.geo]);

  const navUrl = useMemo(() => {
    if (business?.geo?.latitude && business?.geo?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${business.geo.latitude},${business.geo.longitude}`;
    }
    return business?.maps_url ?? null;
  }, [business?.geo, business?.maps_url]);

  const wazeUrl = useMemo(() => {
    if (business?.geo?.latitude && business?.geo?.longitude) {
      return `https://waze.com/ul?ll=${business.geo.latitude},${business.geo.longitude}&navigate=yes`;
    }
    return null;
  }, [business?.geo]);

  if (isHidden('location')) return null;

  return (
    <section id="location" dir={dir} className="py-20 bg-gray-50" data-edit-section="location">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-3">{t('location_title')}</h2>
          <p className="text-gray-500 text-lg">{t('location_subtitle')}</p>
        </motion.div>

        {business && (
          <motion.div
            className="grid md:grid-cols-2 gap-8 items-stretch"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
          >
            {/* Map */}
            <div className="rounded-2xl overflow-hidden shadow-lg min-h-[320px]">
              {mapUrl && (
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 320 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="map"
                />
              )}
            </div>

            {/* Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-center gap-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">📍</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{t('location_address')}</h3>
                  <p className="text-gray-600">{isPrimary ? business.address_he : business.address_en}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <PhoneIconAuto size={28} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{t('location_phone')}</h3>
                  <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                    {business.phone_display}
                  </a>
                </div>
              </div>

              <div className="flex gap-3 mt-2 flex-wrap">
                {navUrl && !isHidden('location_nav_btn') && (
                  <a
                    href={navUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-edit-hide="location_nav_btn"
                    className="relative inline-flex flex-1 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl transition-colors"
                  >
                    🗺️ {t('location_navigate')}
                  </a>
                )}
                {wazeUrl && !isHidden('location_waze_btn') && (
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-edit-hide="location_waze_btn"
                    className="relative inline-flex flex-1 items-center justify-center gap-2 bg-[#05C8F7] hover:bg-[#04b0d8] text-white font-bold py-3 px-5 rounded-xl transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true"><path d="M20.54 6.63C19.42 4.02 16.95 2 14 2c-1.96 0-3.73.77-5.04 2.02A7.01 7.01 0 0 0 3 11c0 .98.2 1.91.55 2.76C2.61 14.4 2 15.63 2 17a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4c0-1.37-.61-2.6-1.55-3.24.35-.85.55-1.78.55-2.76 0-1.67-.48-3.23-1.46-4.37z"/></svg>
                    Waze
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
