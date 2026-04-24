import { motion } from 'motion/react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import { TestimonialsColumns, type TestimonialItem } from '@/components/ui/testimonials-columns';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

/** Split an array into N roughly-equal columns */
function splitToColumns<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: n }, (_, i) =>
    arr.filter((_, idx) => idx % n === i),
  );
}

export default function Reviews() {
  const { reviews, business, isHidden } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  if (isHidden('reviews') || reviews.length === 0) return null;

  // Convert reviews to TestimonialItem shape
  const items: TestimonialItem[] = reviews.map((r) => ({
    text: isPrimary ? r.text_he : r.text_en,
    name: r.author,
    role: r.is_local_guide ? `🏅 ${t('reviews_local_guide')}` : t('reviews_happy'),
    rating: r.rating,
  }));

  // 2 columns on mobile-ish count, 3 when there are enough reviews
  const colCount = items.length >= 6 ? 3 : 2;
  const columns = splitToColumns(items, colCount);

  return (
    <section id="reviews" dir={dir} className="py-20 bg-white overflow-hidden" data-edit-section="reviews">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-black text-gray-900 mb-3">{t('reviews_title')}</h2>
          <div className="w-16 h-1.5 bg-blue-600 rounded mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('reviews_subtitle')}</p>

          {business && (
            <div className="inline-flex items-center gap-4 mt-6 bg-yellow-50 border border-yellow-200 rounded-2xl px-8 py-4">
              <div className="text-5xl font-black text-yellow-500">{business.rating}</div>
              <div>
                <Stars rating={Math.round(business.rating)} />
                <div className="text-sm text-gray-500 mt-1">
                  {t('reviews_based_on')} {business.reviews_count} {t('reviews_reviews')}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Infinite scrolling columns from 21st.dev (470 ⭐) */}
        <TestimonialsColumns columns={columns} baseDuration={18} />
      </div>
    </section>
  );
}
