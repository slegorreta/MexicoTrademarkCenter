import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Star, Shield, Zap, Tag, ChevronDown, CheckCircle2, Sparkles, Search, FileText, HelpCircle, X } from 'lucide-react';
import { useLanguage, type Language } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { LANDING_PAGES, HREFLANG_ALTERNATES, type LandingPageData } from '../data/landingPages';

const PRICE_PER_CLASS = 270;

interface Props {
  lang: string;
}

export default function LandingPage({ lang }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const data: LandingPageData | undefined = LANDING_PAGES[lang];

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showFilingCertModal, setShowFilingCertModal] = useState(false);

  // Keep context language in sync when navigating between language routes within the SPA.
  const syncedLang = useRef<string>('');
  if (data && lang !== syncedLang.current && lang !== language) {
    syncedLang.current = lang;
    setLanguage(lang as Language);
  }

  if (!data) return null;

  const featureIcons = [Sparkles, Tag, Shield];

  const faqCategories: { titleKey: string; items: { q: string; a: string; extra?: React.ReactNode }[] }[] = [
    {
      titleKey: 'faq.cat.eligibility',
      items: [
        { q: t('faq.q1'), a: t('faq.a1') },
        { q: t('faq.q2'), a: t('faq.a2') },
        { q: t('faq.q3'), a: t('faq.a3') },
        { q: t('faq.q4'), a: t('faq.a4') },
      ],
    },
    {
      titleKey: 'faq.cat.fees',
      items: [
        { q: t('faq.q5'), a: t('faq.a5') },
      ],
    },
    {
      titleKey: 'faq.cat.process',
      items: [
        { q: t('faq.q6'), a: t('faq.a6') },
        { q: t('faq.q7'), a: t('faq.a7') },
      ],
    },
    {
      titleKey: 'faq.cat.registration',
      items: [
        { q: t('faq.q8'), a: t('faq.a8') },
        { q: t('faq.q9'), a: t('faq.a9') },
        { q: t('faq.q10'), a: t('faq.a10') },
        { q: t('faq.q11'), a: t('faq.a11') },
        {
          q: t('faq.q12'),
          a: t('faq.a12'),
          extra: (
            <button
              onClick={() => setShowCertModal(true)}
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-gold-700 border border-gold-300 bg-gold-50 hover:bg-gold-100 rounded-lg px-3 py-1.5 transition-colors"
            >
              <FileText size={13} />
              {t('faq.q12.viewCert')}
            </button>
          ),
        },
        {
          q: t('faq.q13'),
          a: t('faq.a13'),
          extra: (
            <Link
              to="/trademark-check"
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-navy-700 border border-navy-200 bg-navy-50 hover:bg-navy-100 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Search size={13} />
              {t('faq.q13.checkLink')}
            </Link>
          ),
        },
        {
          q: t('faq.q14'),
          a: t('faq.a14'),
          extra: (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilingCertModal(true)}
                className="inline-flex items-center gap-2 text-xs font-medium text-navy-700 border border-navy-200 bg-navy-50 hover:bg-navy-100 rounded-lg px-3 py-1.5 transition-colors"
              >
                <FileText size={13} />
                {t('faq.q14.viewFiling')}
              </button>
              <button
                onClick={() => setShowCertModal(true)}
                className="inline-flex items-center gap-2 text-xs font-medium text-gold-700 border border-gold-300 bg-gold-50 hover:bg-gold-100 rounded-lg px-3 py-1.5 transition-colors"
              >
                <FileText size={13} />
                {t('faq.q14.viewReg')}
              </button>
            </div>
          ),
        },
        { q: t('faq.q15'), a: t('faq.a15') },
        { q: t('faq.q16'), a: t('faq.a16') },
      ],
    },
  ];

  return (
    <>
      <SEOHead
        title={data.title}
        description={data.metaDescription}
        canonicalPath={data.url}
        lang={data.bcp47}
        ogLocale={data.ogLocale}
        ogImageAlt={data.ogImageAlt}
        hreflangAlternates={HREFLANG_ALTERNATES}
        faqs={data.faqs}
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-16 left-8 w-72 h-72 bg-gold-500 rounded-full blur-3xl" />
          <div className="absolute bottom-12 right-8 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 ${data.heroVideoId ? 'flex flex-col lg:flex-row items-center gap-12' : ''}`}>
          {/* Text content */}
          <div className={data.heroVideoId ? 'flex-1 min-w-0' : 'max-w-3xl'}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
              {data.h1}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
              {data.valueProposition}
            </p>

            {/* Price */}
            <div className="mb-8">
              <CurrencyDisplay
                usdAmount={PRICE_PER_CLASS}
                targetCurrency={data.targetCurrency}
                chargedInLabel={data.chargedInLabel}
                viewInLabel={data.viewInLabel}
              />
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 mb-10">
              {data.trustStrip.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm text-gray-300">
                  <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col gap-1 mb-4 max-w-md">
              {/* CTA 1 — Check availability */}
              <Link
                to="/trademark-check"
                className="group flex items-center gap-3 bg-white text-navy-900 font-bold px-6 py-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 rounded-xl bg-gold-500 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-400 transition-colors">
                  <Search size={18} className="text-white" />
                </div>
                <span className="text-base font-bold text-navy-900 leading-tight">{t('hero.clearance.cta')}</span>
                <ArrowRight size={18} className="ml-auto text-gold-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>

              {/* Sequence arrow */}
              <div className="flex justify-center py-0.5">
                <ArrowDown size={18} className="text-gold-400/60" />
              </div>

              {/* CTA 2 — Start filing */}
              <Link
                to="/apply"
                className="group flex items-center gap-3 bg-gold-500 hover:bg-gold-400 text-white font-bold px-6 py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-gold-500/25 hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                  <FileText size={18} className="text-white" />
                </div>
                <span className="text-base font-bold leading-tight">{t('hero.cta.start')}</span>
                <ArrowRight size={18} className="ml-auto group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </Link>
            </div>

            {/* AI Idea Generator — secondary nudge */}
            <div className="inline-flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
              <Sparkles size={14} className="text-gold-400 flex-shrink-0" />
              <span className="text-gray-400 text-xs">{t('hero.ai.question')}</span>
              <Link
                to="/trademark-ideas"
                className="flex-shrink-0 text-gold-300 hover:text-gold-200 text-xs font-semibold underline underline-offset-2 transition-colors"
              >
                {t('hero.ai.cta')}
              </Link>
            </div>
          </div>

          {/* Hero video */}
          {data.heroVideoId && (
            <div className="w-full lg:w-[45%] flex-shrink-0">
              <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${data.heroVideoId}`}
                  title="Hero video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-gold-400 text-gold-400" />
                ))}
              </div>
              <div>
                <div className="text-sm font-bold text-navy-900">5.0 / 5</div>
                <div className="text-xs text-gray-500">{data.starLabel}</div>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-gray-200" />
            <p className="text-sm text-gray-600 italic">{data.socialProofLabel}</p>
          </div>

          {/* Testimonials */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={12} className="fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div>
                  <div className="text-sm font-bold text-navy-900">{testimonial.author}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body Copy */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose-custom">
          <h2 className="text-2xl font-bold text-navy-900 mb-4 leading-snug">
            {data.bodyHeading1}
          </h2>
          <p className="text-gray-600 leading-relaxed mb-10">
            {data.bodyParagraph1}
          </p>

          <h2 className="text-2xl font-bold text-navy-900 mb-5 leading-snug">
            {data.bodyHeading2}
          </h2>
          <ul className="space-y-3 mb-10">
            {data.bodyBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-2xl font-bold text-navy-900 mb-4 leading-snug">
            {data.bodyHeading3}
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {data.bodyParagraph3}
          </p>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.features.map((feat, i) => {
              const Icon = featureIcons[i] ?? Zap;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-navy-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={20} className="text-navy-700" />
                  </div>
                  <h3 className="text-base font-bold text-navy-900 mb-2 leading-snug">
                    {feat.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">
                    {feat.description}
                  </p>
                  <Link
                    to={feat.linkTo}
                    className="inline-flex items-center gap-1.5 text-navy-700 hover:text-navy-900 text-xs font-semibold transition-colors"
                  >
                    {feat.linkLabel}
                    <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ — full categorized section matching the main site */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">{t('faq.eyebrow')}</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-4">{t('faq.title')}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm">{t('faq.intro')}</p>
          </div>
          {faqCategories.map((cat, ci) => {
            const baseIndex = faqCategories.slice(0, ci).reduce((acc, c) => acc + c.items.length, 0);
            return (
              <div key={ci} className="mb-10">
                <h3 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <HelpCircle size={15} className="text-gold-500 flex-shrink-0" />
                  {t(cat.titleKey)}
                </h3>
                <div className="space-y-3">
                  {cat.items.map((faq, i) => {
                    const idx = baseIndex + i;
                    return (
                      <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gold-300 transition-colors">
                        <button
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                          onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        >
                          <span className="font-medium text-navy-900 text-sm pr-4">{faq.q}</span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {openFaq === idx && (
                          <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-white">
                            <div className="pt-3">{faq.a}</div>
                            {faq.extra && <div>{faq.extra}</div>}
                          </div>
                        )}
                        {openFaq !== idx && <p className="sr-only">{faq.a}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="mt-10 bg-navy-50 rounded-2xl p-8 text-center border border-navy-100">
            <h3 className="text-lg font-bold text-navy-900 mb-2">{t('faq.stillQuestions')}</h3>
            <p className="text-gray-600 text-sm mb-6">{t('faq.stillQuestions.sub')}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {t('contact.title')}
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-3 leading-snug">
            {data.finalCtaHeading}
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed">
            {data.finalCtaSubtext}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-3 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-base"
            >
              {data.finalCtaButton}
              <ArrowRight size={18} />
            </Link>
            <div className="text-gray-400 text-sm">
              USD ${PRICE_PER_CLASS} {data.perClass}
            </div>
          </div>
        </div>
      </section>

      {/* Sample certificate modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCertModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('faq.q12.viewCert')}</h3>
              <button onClick={() => setShowCertModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <img src="/V4GAB234QBHWBO2ZRAZZA2TTPA.jpg" alt="Sample trademark certificate" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filing certificate modal */}
      {showFilingCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowFilingCertModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('faq.q14.viewFiling')}</h3>
              <button onClick={() => setShowFilingCertModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <img src="/Captura_de_pantalla_2026-05-10_a_la(s)_1.35.26_p.m..png" alt="Filing certificate" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
