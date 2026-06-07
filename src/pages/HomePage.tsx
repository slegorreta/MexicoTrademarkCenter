import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Globe as Globe2, FileText, Award, ChevronDown, Sparkles, Search, HelpCircle, X, Star, Scale, Zap, Quote } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import AboutSection from '../components/AboutSection';
import ComparisonSection from '../components/ComparisonSection';
import PaymentMethodIcons from '../components/PaymentMethodIcons';
import TrustStatsBar from '../components/TrustStatsBar';
import TrademarkPortfolioSection from '../components/TrademarkPortfolioSection';
import impiBuilding from '../assets/IMPI-blindara-artesanias-poblanas-analiza-3-zonas-para-Indicacion-Geografica.webp';
import { LANDING_PAGES } from '../data/landingPages';

export default function HomePage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const testimonialRef = useRef<HTMLElement>(null);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const el = testimonialRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTestimonialsVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageData = LANDING_PAGES[language] ?? LANDING_PAGES['en'];
  const testimonials = pageData.testimonials;
  const socialProofLabel = pageData.socialProofLabel;
  const starLabel = pageData.starLabel;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (window.location.hash === '#faq') {
      setTimeout(() => {
        document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);
  const [showConstanciaModal, setShowConstanciaModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showLawyersModal, setShowLawyersModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showFilingCertModal, setShowFilingCertModal] = useState(false);
  const [showImpiModal, setShowImpiModal] = useState(false);

  const trustBadges = [
    { icon: Globe2, key: 'trust.impi', onTooltip: () => setShowConstanciaModal(true) },
    { icon: Scale, key: 'trust.lawyers.label', onTooltip: () => setShowLawyersModal(true) },
  ];

  const faqCategories: { titleKey: string; items: { q: string; a: string; extra?: ReactNode }[] }[] = [
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
              {t('faq.q12.viewCert') || 'View sample certificate'}
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
              {t('faq.q13.checkLink') || 'Run a trademark search'}
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

  const proofLabels = [
    'home.proof.amazon',
    'home.proof.mercadolibre',
    'home.proof.exporters',
    'home.proof.smes',
    'home.proof.oem',
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-5">
                {t('hero_headline')}
              </h1>
              <p className="text-base text-gray-300 leading-relaxed mb-4 max-w-xl">
                {t('hero_subhead')}
              </p>
              <p className="text-[14px] text-white/80 mb-8 max-w-xl leading-relaxed">
                {t('hero.trustLine')}
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-col gap-3 mb-5 max-w-2xl">
                {/* CTA 1 — Search with embedded input field */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    sessionStorage.setItem('tcpMark', searchQuery.trim());
                    navigate('/trademark-check');
                  }}
                  className="group flex flex-col gap-3 bg-gold-500 hover:bg-gold-400 text-white font-bold px-5 pt-5 pb-4 rounded-2xl transition-all duration-200 shadow-xl hover:shadow-gold-500/30 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Search size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-[0.1em] leading-none">{t('hero.step1_label')}</span>
                      <span className="text-sm font-bold leading-snug">{t('cta_check_available')}</span>
                    </div>
                  </div>

                  {/* Inline search field */}
                  <div className="flex items-center gap-2 bg-white rounded-xl overflow-hidden shadow-inner">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Enter your trademark name…"
                      className="flex-1 px-4 py-3 text-navy-900 text-sm font-medium placeholder-gray-400 bg-transparent outline-none"
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white font-bold text-sm px-4 py-3 transition-colors flex-shrink-0"
                    >
                      Search
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>

                {/* CTA 2 & 3 — side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* CTA 2 — File (sky blue) */}
                  <Link
                    to="/apply"
                    className="group flex flex-col items-center text-center gap-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 py-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-[0.1em] leading-none">{t('hero.step2_label')}</span>
                      <span className="text-xs font-bold leading-snug">{t('cta_start_filing_full')}</span>
                    </div>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform opacity-70" />
                  </Link>

                  {/* CTA 3 — Idea generator (emerald) */}
                  <Link
                    to="/trademark-ideas"
                    className="group flex flex-col items-center text-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-6 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-extrabold text-white/80 uppercase tracking-[0.1em] leading-none">{t('hero.step3_label')}</span>
                      <span className="text-xs font-bold leading-snug">{t('cta_idea_generator_full')}</span>
                    </div>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform opacity-70" />
                  </Link>
                </div>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-6">
                {trustBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-gray-400">
                    <badge.icon size={14} className="text-gold-400 flex-shrink-0" />
                    <span className="text-xs">{t(badge.key)}</span>
                    {badge.onTooltip && (
                      <button
                        onClick={badge.onTooltip}
                        className="text-gold-400/60 hover:text-gold-300 transition-colors flex-shrink-0"
                      >
                        <HelpCircle size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {/* Microcopy as trust item */}
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Zap size={14} className="text-gold-400 flex-shrink-0" />
                  <span className="text-xs">{t('cta_check_microcopy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <TrustStatsBar />

      {/* Trademark Portfolio */}
      <TrademarkPortfolioSection />

      {/* Video Section */}
      {(() => {
        const videoIdByLocale: Record<string, string> = {
          en: 'vIK7hikaVp0',
          fr: 'Du3E8fxOU18',
          de: 'pl_AUmsc_gU',
          es: 'N4wNYJO06Go',
          pt: 'TZVJ_whPSck',
          zh: 'UOtEg9rUrlA',
          ja: '-fsnNbCjk7c',
        };
        const videoId = videoIdByLocale[language] ?? videoIdByLocale['en'];
        const videoSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        return (
          <section className="bg-[#1a3a2a] py-12 lg:py-20">
            <div className="max-w-[720px] mx-auto px-6">
              <div className="text-center mb-6">
                <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-2">
                  {t('video.eyebrow')}
                </div>
                <p className="text-white/80 text-base">{t('video.subhead')}</p>
              </div>
              <div className="relative w-full" style={{ paddingBottom: '56.25%', height: 0 }}>
                <iframe
                  src={videoSrc}
                  title={t('video.eyebrow')}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </section>
        );
      })()}

      {/* Testimonials */}
      <section
        ref={testimonialRef}
        className="py-14 lg:py-20 bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-10">
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-gold-400 text-gold-400" />
                ))}
              </div>
              <span className="text-base font-bold text-navy-900 ml-1">5.0</span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gray-200" />
            <p className="text-sm text-gray-500 text-center sm:text-left">{socialProofLabel}</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => {
              const initials = testimonial.author
                .split(' ')
                .slice(0, 2)
                .map(w => w[0])
                .join('')
                .toUpperCase();
              const avatarColors = [
                'bg-gold-100 text-gold-700',
                'bg-sky-100 text-sky-700',
                'bg-emerald-100 text-emerald-700',
              ];
              return (
                <div
                  key={i}
                  className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300"
                  style={{
                    opacity: testimonialsVisible ? 1 : 0,
                    transform: testimonialsVisible ? 'translateY(0)' : 'translateY(16px)',
                    transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
                  }}
                >
                  {/* Decorative quote mark */}
                  <Quote size={20} className="text-gold-200 mb-3 fill-gold-100" />

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} size={12} className="fill-gold-400 text-gold-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 italic flex-1">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author row */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy-900 leading-tight">{testimonial.author}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Constancia de Presentación modal */}
      {showConstanciaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowConstanciaModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('trust.impi.tooltip.title')}</h3>
              <button onClick={() => setShowConstanciaModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{t('trust.impi.tooltip.body')}</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <img src="/CONSTANCIA_DE_REGISTRO.png" alt="Constancia de Presentación IMPI" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savings / Why cheaper modal */}
      {showSavingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowSavingsModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={18} className="text-green-600" />
                </div>
                <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('trust.savings.tooltip.title')}</h3>
              </div>
              <button onClick={() => setShowSavingsModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                <div className="text-center flex-1 border-r border-gray-200">
                  <div className="text-2xl font-bold text-gray-400 line-through">$800+</div>
                  <div className="text-xs text-gray-500 mt-0.5">Traditional firms</div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-green-600">$299</div>
                  <div className="text-xs text-gray-500 mt-0.5">Mexico Trademark Center</div>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{t('trust.savings.tooltip.body')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lawyers modal */}
      {showLawyersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowLawyersModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <Scale size={18} className="text-navy-700" />
                </div>
                <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('trust.lawyers.tooltip.title')}</h3>
              </div>
              <button onClick={() => setShowLawyersModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">{t('trust.lawyers.tooltip.body')}</p>
              <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-5 bg-gray-50">
                <div className="flex-shrink-0 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                  <img
                    src="/download.png"
                    alt="Managing Intellectual Property — IP Stars"
                    className="block object-contain"
                    style={{ width: 80, height: 80 }}
                  />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Managing IP · IP Stars</div>
                  <div className="text-xs text-gray-500 mt-0.5">Leading global directory for top-ranked IP practitioners</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trademark Certificate modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowCertModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('faq.q12')}</h3>
              <button onClick={() => setShowCertModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{t('faq.a12')}</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <img src="/TITULO_DE_MARCA.png" alt="Título de Registro de Marca IMPI" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filing Certificate modal */}
      {showFilingCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowFilingCertModal(false)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <h3 className="text-navy-900 font-bold text-base leading-tight">{t('faq.q14.viewFiling')}</h3>
              <button onClick={() => setShowFilingCertModal(false)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5">
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <img src="/CONSTANCIA_DE_REGISTRO.png" alt="Constancia de Presentación IMPI" className="w-full h-auto block" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Preview */}
      <section className="py-16 lg:py-20 bg-navy-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
              {t('pricing.eyebrow')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">{t('pricing.title')}</h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t('pricing.sub')}</p>
          </div>
          <div className="max-w-sm mx-auto mb-8">
            <div className="rounded-2xl bg-gold-500 border-2 border-gold-400 shadow-2xl p-8 text-center">
              <div className="text-xs font-bold text-white/80 uppercase tracking-widest mb-3">
                {t('pricing.package.label')}
              </div>
              <div className="text-6xl font-bold mb-1">$299</div>
              <div className="text-white/80 text-sm mb-5">
                {t('pricing.package.perClass')}
              </div>
              <div className="bg-white/15 rounded-xl px-5 py-4 text-left space-y-2 mb-5">
                <div className="flex justify-between text-sm text-white/90">
                  <span>{t('pricing.package.serviceFee')}</span>
                  <span className="font-semibold">USD $129</span>
                </div>
                <div className="flex justify-between text-sm text-white/90">
                  <span>{t('pricing.package.govFee')}</span>
                  <span className="font-semibold">USD $170</span>
                </div>
              </div>
              <div className="text-xs text-white/70">{t('pricing.govFee')}</div>
              <p className="text-xs font-bold text-white mt-3">{t('pricing.taxesIncluded')}</p>
            </div>
          </div>
          <div className="my-4">
            <PaymentMethodIcons size="md" align="center" variant="light" />
          </div>
          <p className="text-center text-gray-500 text-xs mb-5">{t('pricing.govFeeNote')}</p>
          <div className="text-center">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg"
            >
              {t('pricing.startFiling')}
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Inline Comparison Table */}
      <ComparisonSection />

      {/* 3-Step Process */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">
              {t('process.eyebrow')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-4">{t('process.title')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gold-200" />
            {[
              { num: '01', title: t('process.step1.title'), desc: t('process.step1.desc'), icon: FileText, isImpi: false, showPayment: false },
              { num: '02', title: t('process.step2.title'), desc: t('process.step2.desc'), icon: Shield, isImpi: false, showPayment: false },
              { num: '03', title: t('process.step3.title'), desc: t('process.step3.desc'), icon: Award, isImpi: true, showPayment: false },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <step.icon size={28} className="text-gold-400" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-gold-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-3 flex items-center justify-center gap-1.5">
                  {step.title}
                  {step.isImpi && (
                    <button
                      type="button"
                      onClick={() => setShowImpiModal(true)}
                      className="flex-shrink-0 w-5 h-5 rounded-full bg-navy-100 hover:bg-navy-200 text-navy-600 flex items-center justify-center transition-colors"
                      aria-label="More about IMPI system availability"
                    >
                      <HelpCircle size={11} />
                    </button>
                  )}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
                {step.showPayment && (
                  <div className="mt-3">
                    <PaymentMethodIcons size="sm" align="center" variant="dark" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* IMPI availability modal */}
          {showImpiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowImpiModal(false)}>
              <div className="absolute inset-0 bg-black/50" />
              <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10" onClick={e => e.stopPropagation()}>
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={impiBuilding}
                    alt="IMPI — Instituto Mexicano de la Propiedad Industrial"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <p className="text-white text-xs font-medium opacity-80">IMPI — Instituto Mexicano de la Propiedad Industrial</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowImpiModal(false)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {t('disclaimer.impi.availability')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ — full section */}
      <section id="faq" className="py-16 lg:py-20 bg-gray-50">
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
                          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white transition-colors"
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

      {/* ── About Us ──────────────────────────────────────────────────────── */}
      <AboutSection />

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-gold-500 to-gold-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-white/90 mb-8">
            {t('home.cta.sub')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-white text-gold-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-md"
            >
              {t('hero.cta.start')}
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors"
            >
              {t('home.cta.talk')}
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
            {proofLabels.map((key, i) => (
              <div key={i} className="flex items-center gap-2">
                <Star size={14} className="text-gold-400 fill-gold-400" />
                <span className="text-sm font-medium text-gray-500">{t(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
