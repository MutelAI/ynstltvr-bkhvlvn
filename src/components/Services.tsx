import { motion } from 'motion/react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid';

export default function Services() {
  const { services, isHidden } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  if (isHidden('services') || services.length === 0) return null;

  const items: BentoItem[] = services.map((service, i) => ({
    icon: <span className="text-2xl">{service.icon}</span>,
    title: isPrimary ? service.title_he : service.title_en,
    description: isPrimary ? service.desc_he : service.desc_en,
    status: t('services_title'),
    tags: [],
    cta: '→',
    colSpan: services.length <= 3 ? 1 : i === 0 ? 2 : 1,
    hasPersistentHover: i === 0,
  }));

  return (
    <section id="services" dir={dir} className="py-20 bg-white" data-edit-section="services">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black text-gray-900 mb-3">{t('services_title')}</h2>
          <div className="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('services_subtitle')}</p>
        </motion.div>

        {/* BentoGrid (338⭐ on 21st.dev) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <BentoGrid items={items} />
        </motion.div>
      </div>
    </section>
  );
}
