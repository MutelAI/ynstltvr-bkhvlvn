import { useState } from 'react';
import { useBusiness } from '@/context/BusinessContext';
import { useI18n } from '@/context/I18nContext';
import { buildWhatsappUrl } from '@/lib/whatsapp';
import { PhoneIconAuto, WhatsAppIconAuto } from '@/icons/ContactIcons';
import { SparklesText } from '@/components/ui/sparkles-text';

interface ContactForm {
  name: string;
  phone: string;
  message: string;
}

export default function Contact() {
  const { business } = useBusiness();
  const { t, dir, isPrimary } = useI18n();
  const [form, setForm] = useState<ContactForm>({ name: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const waUrl = buildWhatsappUrl(
    business?.whatsapp || business?.phone,
    `${t('contact_wa_intro')} ${form.name || '...'}\n${t('contact_wa_phone_label')} ${form.phone || '...'}\n${t('contact_wa_message_label')} ${form.message || t('contact_wa_default_msg')}`,
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      dir={dir}
      className="py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Info side */}
          <div className="text-white">
            {/* SparklesText (261⭐ on 21st.dev) */}
            <SparklesText
              text={t('contact_title')}
              className="text-4xl font-black text-white mb-3 justify-start"
              sparklesCount={6}
              colors={{ first: '#fde68a', second: '#ffffff' }}
            />
            <div className="w-16 h-1.5 bg-white/50 rounded mb-6" />
            <p className="text-white/80 text-lg mb-8" data-edit-key="translations.contact_subtitle.he">
              {t('contact_subtitle')}
            </p>

            <div className="space-y-4">
              {business && (
                <>
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-4 bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl px-5 py-4 transition-all"
                  >
                    <PhoneIconAuto size={22} />
                    <div>
                      <div className="text-xs text-white/65 mb-0.5">{t('contact_call')}</div>
                      <div className="font-bold text-lg">{business.phone_display}</div>
                    </div>
                  </a>

                  <a
                    href={buildWhatsappUrl(business.whatsapp || business.phone, t('contact_wa_default_msg'))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-green-500/80 hover:bg-green-500 border border-green-400/30 rounded-2xl px-5 py-4 transition-all"
                  >
                    <WhatsAppIconAuto size={22} />
                    <div>
                      <div className="text-xs text-green-100 mb-0.5">{t('contact_whatsapp')}</div>
                      <div className="font-bold text-lg">{business.phone_display}</div>
                    </div>
                  </a>

                  <a
                    href={business.maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl px-5 py-4 transition-all"
                  >
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="text-xs text-white/65 mb-0.5">{t('contact_address')}</div>
                      <div className="font-semibold">
                        {isPrimary ? business.address_he : business.address_en}
                      </div>
                    </div>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-black text-gray-800 mb-2">{t('contact_thanks_title')}</h3>
                <p className="text-gray-500">{t('contact_thanks_desc')}</p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h3 className="text-xl font-black text-gray-800 mb-6">{t('contact_form_title')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('contact_name')}</label>
                    <input
                      type="text"
                      placeholder={t('contact_name_placeholder')}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('contact_phone')}</label>
                    <input
                      type="tel"
                      placeholder={t('contact_phone_placeholder')}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{t('contact_message')}</label>
                    <textarea
                      placeholder={t('contact_message_placeholder')}
                      rows={4}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
                  >
                    {t('contact_submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
