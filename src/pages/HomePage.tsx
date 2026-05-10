import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown, Clock, Globe as Globe2, Zap, FileText, Award, ChevronDown, Sparkles, Search, HelpCircle, X, Star } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PriceGuaranteeBadge from '../components/PriceGuaranteeBadge';
import { useState } from 'react';

export default function HomePage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showConstanciaModal, setShowConstanciaModal] = useState(false);

  const trustBadges = [
    { icon: Clock, key: 'trust.filing' },
    { icon: Globe2, key: 'trust.impi', tooltip: true },
    { icon: Zap, key: 'trust.bilingual' },
  ];

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              {t('hero.headline')}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
              {t('hero.subheading')}
            </p>

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

              {/* CTA 2 — Register now */}
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

            {/* Trust row */}
            <div className="flex flex-wrap gap-4 mt-8">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <badge.icon size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-sm">{t(badge.key)}</span>
                  {badge.tooltip && (
                    <button
                      onClick={() => setShowConstanciaModal(true)}
                      className="text-gold-400/70 hover:text-gold-300 transition-colors flex-shrink-0"
                      aria-label={t('trust.impi.tooltip.title')}
                    >
                      <HelpCircle size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Constancia de Presentación modal */}
      {showConstanciaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowConstanciaModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-navy-900 font-bold text-lg leading-tight">{t('trust.impi.tooltip.title')}</h3>
              </div>
              <button
                onClick={() => setShowConstanciaModal(false)}
                className="ml-4 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-gray-600 text-sm leading-relaxed mb-5">{t('trust.impi.tooltip.body')}</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <div className="bg-gray-800 text-white text-xs font-semibold px-3 py-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                  gob.mx — Instituto Mexicano de la Propiedad Industrial
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-center text-xs font-bold text-gray-700 border-b border-gray-200 pb-2">
                    Instituto Mexicano de la Propiedad Industrial
                  </div>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <div className="flex-1 border border-gray-300 rounded p-2 space-y-1">
                      <div className="font-semibold text-gray-800">DIRECCIÓN DIVISIONAL DE MARCAS</div>
                      <div className="text-gray-500">SUBDIRECCIÓN DIVISIONAL DE PROCESAMIENTO ADMINISTRATIVO DE MARCAS</div>
                      <div className="text-gray-500">COORDINACIÓN DEPARTAMENTAL DE RECEPCIÓN Y CONTROL DE DOCUMENTOS</div>
                    </div>
                    <div className="flex-1 border border-gray-300 rounded p-2 space-y-1">
                      <div className="flex justify-between"><span className="font-semibold">EXPEDIENTE:</span><span className="bg-gray-800 text-gray-800 rounded px-2">███</span></div>
                      <div className="flex justify-between"><span className="font-semibold">FOLIO DE RECEPCIÓN:</span><span className="bg-gray-800 text-gray-800 rounded px-2">███</span></div>
                      <div className="text-gray-500 text-xs mt-1">FECHA Y HORA DE LA RECEPCIÓN DE LA SOLICITUD: <span className="bg-gray-800 text-gray-800 rounded px-2">████████</span></div>
                    </div>
                  </div>
                  <div className="border border-gray-300 rounded p-2 space-y-1 text-xs text-gray-700">
                    <div className="font-semibold bg-gray-100 px-1">SOLICITUD DE:</div>
                    <div className="font-semibold bg-gray-100 px-1">REGISTRO DE MARCA</div>
                    <div className="font-semibold bg-gray-100 px-1 mt-1">SOLICITANTE(S) O REPRESENTANTE LEGAL:</div>
                    <div className="bg-gray-800 text-gray-800 rounded px-2 w-32">████████</div>
                  </div>
                  <div className="border-t border-gray-200 pt-2 text-xs text-gray-500 italic">
                    CON LA FECHA Y HORA REFERIDA SE HA RECIBIDO SU SOLICITUD CON LOS DATOS SEÑALADOS DE LA QUE SE ACUSA RECIBO.
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">FIRMA DE ACUSE — Sello Digital del IMPI</span>
                    <div className="mt-1 bg-gray-800 rounded h-10 w-40" />
                  </div>
                </div>
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
              <div className="text-6xl font-bold mb-1">$270</div>
              <div className="text-white/80 text-sm mb-5">
                {t('pricing.package.perClass')}
              </div>
              <div className="bg-white/15 rounded-xl px-5 py-4 text-left space-y-2 mb-5">
                <div className="flex justify-between text-sm text-white/90">
                  <span>{t('pricing.package.serviceFee')}</span>
                  <span className="font-semibold">USD $100</span>
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
          <p className="text-center text-gray-500 text-xs mb-5">{t('pricing.govFeeNote')}</p>
          <div className="flex justify-center mb-8">
            <PriceGuaranteeBadge variant="inline" />
          </div>
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
              { num: '01', title: t('process.step1.title'), desc: t('process.step1.desc'), icon: FileText },
              { num: '02', title: t('process.step2.title'), desc: t('process.step2.desc'), icon: Shield },
              { num: '03', title: t('process.step3.title'), desc: t('process.step3.desc'), icon: Award },
            ].map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-navy-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <step.icon size={28} className="text-gold-400" />
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 bg-gold-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-amber-800 text-sm">{t('disclaimer.filing')}</p>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-4">{t('faq.title')}</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-navy-900 text-sm pr-4">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
                    <div className="pt-3">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="text-gold-600 font-medium hover:text-gold-700 text-sm">
              {t('faq.viewAll')}
            </Link>
          </div>
        </div>
      </section>

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
