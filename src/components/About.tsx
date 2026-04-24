import { motion } from 'motion/react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid';

export default function About() {
  const { business, hours, isHidden } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  const stats: BentoItem[] = [
    {
      icon: <span className="text-xl">⭐</span>,
      title: t('about_rating_label'),
      description: t('about_desc'),
      meta: business?.rating?.toFixed(1) ?? '–',
      status: 'Google',
      tags: [t('about_tag_rating')],
      colSpan: 2,
      hasPersistentHover: true,
    },
    {
      icon: <span className="text-xl">😊</span>,
      title: t('about_reviews_label'),
      description: `${business?.reviews_count ?? 0}+ ${t('reviews_happy')}`,
      status: t('reviews_happy'),
      tags: [t('about_tag_reviews')],
    },
    {
      icon: <span className="text-xl">🏆</span>,
      title: t('about_years_label'),
      description: t('about_desc'),
      meta: '10+',
      status: t('about_years_label'),
      tags: [t('about_tag_experience')],
    },
    {
      icon: <span className="text-xl">📅</span>,
      title: t('about_available_label'),
      description: t('hero_available'),
      meta: '24/7',
      status: t('about_status_active'),
      tags: [t('about_tag_availability')],
    },
  ];

  return (
    <section id="about" dir={dir} className="py-20 bg-gray-50" data-edit-section="about">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black text-gray-900 mb-3">{t('about_title')}</h2>
          <div className="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4" />
          <p className="text-gray-500 text-lg max-w-2xl mx-auto" data-edit-key="translations.about_desc.he">
            {t('about_desc')}
          </p>
        </motion.div>

        {/* BentoGrid stats (338⭐ on 21st.dev) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <BentoGrid items={stats} className="max-w-4xl mx-auto mb-10" />
        </motion.div>

        {/* Hours */}
        {hours.length > 0 && !isHidden('hours') && (
          <motion.div
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🕐 {t('hours_title')}
            </h3>
            <div className="space-y-2">
              {hours.map((h) => (
                <div key={h.day_key} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">
                    {isPrimary ? h.day_he : h.day_en}
                  </span>
                  <span className={h.is_open ? 'text-green-600 font-semibold' : 'text-red-400'}>
                    {isPrimary ? h.hours_he : h.hours_en}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
