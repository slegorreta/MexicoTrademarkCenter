import { useState } from 'react';
import { ChevronDown, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function FAQPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
    { q: t('faq.q9'), a: t('faq.a9') },
    { q: t('faq.q10'), a: t('faq.a10') },
    { q: t('faq.q11'), a: t('faq.a11') },
  ];

  const categories = [
    { titleKey: 'faq.cat.eligibility', indices: [0, 1, 2, 3] },
    { titleKey: 'faq.cat.fees', indices: [4] },
    { titleKey: 'faq.cat.process', indices: [5, 6] },
    { titleKey: 'faq.cat.registration', indices: [7, 8, 9, 10] },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
            {t('faq.eyebrow')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{t('faq.title')}</h1>
          <p className="text-gray-300 max-w-xl mx-auto">
            {t('faq.intro')}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {categories.map((cat, ci) => (
            <div key={ci} className="mb-10">
              <h2 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <LinkIcon size={16} className="text-gold-500" />
                {t(cat.titleKey)}
              </h2>
              <div className="space-y-3">
                {cat.indices.map(idx => (
                  <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gold-300 transition-colors">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    >
                      <span className="font-medium text-navy-900 pr-4">{faqs[idx].q}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 flex-shrink-0 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openIndex === idx && (
                      <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50">
                        <div className="pt-4">{faqs[idx].a}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions */}
          <div className="mt-12 bg-navy-50 rounded-2xl p-8 text-center border border-navy-100">
            <h3 className="text-lg font-bold text-navy-900 mb-2">
              {t('faq.stillQuestions')}
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {t('faq.stillQuestions.sub')}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {t('contact.title')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
