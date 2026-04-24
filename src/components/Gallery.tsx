import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import { SparklesText } from '@/components/ui/sparkles-text';

export default function Gallery() {
  const { photos, design, isHidden } = useBusiness();
  const { t, dir, isPrimary } = useI18n();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (isHidden('gallery') || photos.length === 0) return null;

  const openLightbox = (i: number) => setLightboxIdx(i);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx((i) => (i! > 0 ? i! - 1 : photos.length - 1));
  const next = () => setLightboxIdx((i) => (i! < photos.length - 1 ? i! + 1 : 0));

  return (
    <section id="gallery" dir={dir} className="py-20 bg-gray-50" data-edit-section="gallery">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          {/* SparklesText (261⭐ on 21st.dev) */}
          <SparklesText
            text={t('gallery_title')}
            className="text-4xl font-black text-gray-900 mb-3 justify-center"
            sparklesCount={8}
            colors={{ first: '#3b82f6', second: '#06b6d4' }}
          />
          <div className="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('gallery_subtitle')}</p>
        </motion.div>

        {/* Masonry / grid */}
        {design.gallery_style === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-edit-add-photo="photos">
            {photos.map((photo, i) => (
              <div
                key={photo.url}
                className="aspect-square cursor-pointer overflow-hidden rounded-xl group relative"
                onClick={() => openLightbox(i)}
                data-edit-delete={`photos.${i}`}
                data-edit-img={`photos.${i}.url`}
              >
                <img
                  src={photo.thumb}
                  alt={isPrimary ? photo.alt_he : photo.alt_en}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3" data-edit-add-photo="photos">
            {photos.map((photo, i) => (
              <div
                key={photo.url}
                className="break-inside-avoid cursor-pointer overflow-hidden rounded-xl group relative"
                onClick={() => openLightbox(i)}
                data-edit-delete={`photos.${i}`}
                data-edit-img={`photos.${i}.url`}
              >
                <img
                  src={photo.thumb}
                  alt={isPrimary ? photo.alt_he : photo.alt_en}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <img
              src={photos[lightboxIdx].url}
              alt={isPrimary ? photos[lightboxIdx].alt_he : photos[lightboxIdx].alt_en}
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 leading-none"
              aria-label={t('lightbox_close')}
            >
              ×
            </button>
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
                  aria-label={t('lightbox_prev')}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
                  aria-label={t('lightbox_next')}
                >
                  ›
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
