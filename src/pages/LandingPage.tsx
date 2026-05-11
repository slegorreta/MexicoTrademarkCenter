import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Zap, Tag, ChevronDown, ChevronUp, CheckCircle2, Sparkles, Globe } from 'lucide-react';
import { useLanguage, type Language } from '../context/LanguageContext';
import SEOHead from '../components/SEOHead';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { LANDING_PAGES, HREFLANG_ALTERNATES, type LandingPageData } from '../data/landingPages';

const PRICE_PER_CLASS = 270;

interface Props {
  lang: string;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-navy-900 leading-snug group-hover:text-navy-700 transition-colors">
          {q}
        </span>
        <span className="flex-shrink-0 mt-0.5 text-gray-400 group-hover:text-navy-600 transition-colors">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <p className="pb-5 text-gray-600 text-sm leading-relaxed">
          {a}
        </p>
      )}
      {/* Always render answer for crawlers — visually hidden when closed */}
      {!open && <p className="sr-only">{a}</p>}
    </div>
  );
}

const ZH_VIDEO_EMBED_URL = 'https://drive.google.com/file/d/1w1CTtufXgpO-vT-UogW1R9PCUcNxTRb6/preview';

export default function LandingPage({ lang }: Props) {
  const { language, setLanguage } = useLanguage();
  const data: LandingPageData | undefined = LANDING_PAGES[lang];

  // Keep context language in sync when navigating between language routes within the SPA.
  // Using a ref to avoid a render loop — this runs synchronously during render, not as an effect.
  const syncedLang = useRef<string>('');
  if (data && lang !== syncedLang.current && lang !== language) {
    syncedLang.current = lang;
    setLanguage(lang as Language);
  }

  if (!data) return null;

  const featureIcons = [Sparkles, Tag, Shield];

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
        <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 ${lang === 'zh' ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center' : ''}`}>
          {/* Text content */}
          <div className={lang === 'zh' ? '' : 'max-w-3xl'}>
            <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              <span className="text-gold-300 text-sm font-medium">MexicoTrademarkCenter</span>
            </div>

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

            {/* CTA */}
            <Link
              to="/apply"
              className="inline-flex items-center gap-3 bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 text-base"
            >
              {data.ctaLabel}
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Chinese hero video */}
          {lang === 'zh' && (
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video">
              <iframe
                src={ZH_VIDEO_EMBED_URL}
                className="w-full h-full"
                allow="autoplay"
                allowFullScreen
                title="墨西哥商标注册流程介绍"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 pointer-events-none">
                <p className="text-xs text-gray-300 text-center">墨西哥商标注册流程介绍</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
            {/* Stars */}
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
            {data.testimonials.map((t, i) => (
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
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <div className="text-sm font-bold text-navy-900">{t.author}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.role}</div>
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

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-navy-700 font-semibold text-sm uppercase tracking-wider mb-2">
            <Globe size={14} />
            FAQ
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-8 leading-snug">
            {data.faqs[0]?.q ? 'FAQ' : 'Frequently Asked Questions'}
          </h2>
          <div className="bg-gray-50 rounded-2xl px-6 divide-y divide-gray-100">
            {data.faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} />
            ))}
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
    </>
  );
}
