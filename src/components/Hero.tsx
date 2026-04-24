import { motion } from 'motion/react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import ServiceIcon from '@/icons/ServiceIcon';
import { PhoneIconAuto, WhatsAppIconAuto } from '@/icons/ContactIcons';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { AnimatedTextCycle } from '@/components/ui/animated-text-cycle';
import { buildWhatsappUrl } from '@/lib/whatsapp';
export { buildWhatsappUrl };

/** Picks the best photo for hero display.
 * Parses Google Maps thumb URL dimensions (=wW-hH) and prefers landscape
 * ratio closest to 1.4 (4:3 / 3:2) — looks best in a wide centred card. */
function pickHeroPhoto(photos: { url: string; thumb: string; alt_he: string; alt_en: string }[]) {
  if (!photos.length) return null;
  const dimRe = /=w(\d+)-h(\d+)/;
  const scored = photos.map(p => {
    const m = dimRe.exec(p.thumb || p.url);
    const ratio = m ? parseInt(m[1]) / parseInt(m[2]) : 1;
    return { p, score: -Math.abs(ratio - 1.4) }; // closer to 1.4 = higher score
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].p;
}

export default function Hero() {
  const { business, photos } = useBusiness();
  const { t, dir, isPrimary } = useI18n();

  const waUrl = buildWhatsappUrl(
    business?.whatsapp || business?.phone,
    `${t('contact_wa_intro')} - ${t('contact_wa_default_msg')}`,
  );

  const heroPhoto = pickHeroPhoto(photos);

  // Words to cycle through below the business name (uses translations for any language)
  const cycleWords = [t('hero_cycle_1'), t('hero_cycle_2'), t('hero_cycle_3'), t('hero_cycle_4')];

  return (
    <AuroraBackground
      id="hero"
      dir={dir}
      className="min-h-screen flex items-center justify-center"
      // Override default zinc background with the signature blue gradient
      style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #1d4ed8, #0ea5e9)' }}
    >
      <motion.div
        className="relative z-10 text-center px-6 max-w-4xl mx-auto py-32"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 text-sm font-medium text-white mb-6">
          <ServiceIcon icon={business?.logo_emoji || 'Home'} size={20} />
          <span>{t('hero_badge')}</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight leading-tight">
          {isPrimary ? business?.name : business?.name_en}
        </h1>

        {/* Animated cycling word */}
        <div className="text-2xl md:text-3xl font-bold text-white/90 mb-5 flex items-center justify-center gap-2 h-10">
          <AnimatedTextCycle
            words={cycleWords}
            className="text-yellow-300"
            height="1.4em"
          />
        </div>

        {/* Subtitle */}
        <p className="text-xl text-white/80 mb-6 font-light">{t('hero_subtitle')}</p>

        {/* Hero image — best landscape photo from the business */}
        {heroPhoto && (
          <motion.div
            className="relative max-w-lg mx-auto mb-6"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-2xl scale-105 pointer-events-none" />
            <img
              src={heroPhoto.url}
              alt={isPrimary ? heroPhoto.alt_he : heroPhoto.alt_en}
              className="relative w-full aspect-video object-cover rounded-2xl border border-white/20 shadow-2xl shadow-black/40"
              loading="eager"
            />
          </motion.div>
        )}

        {/* Rating */}
        {business && (
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-yellow-300 text-lg">⭐ {business.rating}</span>
            <span className="text-white/65 text-sm">
              ({business.reviews_count}+ {t('reviews_happy')})
            </span>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`tel:${business?.phone}`}
            className="w-full sm:w-auto bg-white text-gray-800 font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:shadow-blue-300/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <PhoneIconAuto size={20} className="shrink-0" /> {t('hero_cta_call')}
          </a>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-green-500 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl hover:shadow-green-400/50 hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <WhatsAppIconAuto size={20} className="shrink-0" /> {t('hero_cta_whatsapp')}
          </a>
        </div>

        <p className="mt-6 text-white/65 text-sm">✅ {t('hero_available')}</p>
      </motion.div>
    </AuroraBackground>
  );
}
