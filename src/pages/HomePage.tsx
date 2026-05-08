import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Globe as Globe2, CheckCircle2, Star, Zap, FileText, Award, Users, TrendingUp, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PriceGuaranteeBadge from '../components/PriceGuaranteeBadge';
import { useState } from 'react';

export default function HomePage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const trustBadges = [
    { icon: Clock, key: 'trust.filing' },
    { icon: Globe2, key: 'trust.impi' },
    { icon: Shield, key: 'trust.secure' },
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

  const cards = [
    { icon: TrendingUp, titleKey: 'for.card1.title', descKey: 'for.card1.desc' },
    { icon: Globe2, titleKey: 'for.card2.title', descKey: 'for.card2.desc' },
    { icon: FileText, titleKey: 'for.card3.title', descKey: 'for.card3.desc' },
    { icon: Users, titleKey: 'for.card4.title', descKey: 'for.card4.desc' },
  ];

  const whyBullets = [
    'why.bullet1',
    'why.bullet2',
    'why.bullet3',
    'why.bullet4',
    'why.bullet5',
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
            <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse" />
              <span className="text-gold-300 text-sm font-medium">
                {t('hero.badge')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6">
              {t('hero.headline')}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">
              {t('hero.subheading')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/apply"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-gold-500/25"
              >
                {t('hero.cta.start')}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200"
              >
                {t('hero.cta.pricing')}
              </Link>
            </div>

            {/* AI Idea Generator nudge */}
            <div className="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium">{t('hero.ai.question')}</p>
                <p className="text-xs text-gray-400">{t('hero.ai.desc')}</p>
              </div>
              <Link
                to="/trademark-ideas"
                className="flex-shrink-0 flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              >
                {t('hero.ai.cta')}
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap gap-4 mt-8">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <badge.icon size={16} className="text-gold-400 flex-shrink-0" />
                  <span className="text-sm">{t(badge.key)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why protect */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">
                {t('why.eyebrow')}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-6">
                {t('why.title')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('why.sub')}
              </p>
              <ul className="space-y-3">
                {whyBullets.map((key, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-gold-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg"
                alt="Business professionals"
                className="rounded-2xl shadow-xl w-full object-cover h-80 lg:h-96"
              />
              <div className="absolute -bottom-4 -left-4 bg-gold-500 rounded-xl p-4 shadow-xl">
                <div className="text-white font-bold text-2xl">45</div>
                <div className="text-gold-100 text-xs">{t('why.niceClasses')}</div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-xl border border-gray-100">
                <div className="text-navy-900 font-bold text-2xl">24h</div>
                <div className="text-gray-500 text-xs">{t('why.filingTarget')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For businesses */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-gold-600 font-semibold text-sm uppercase tracking-wider mb-3">
              {t('for.eyebrow')}
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-900 mb-4">{t('for.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('for.sub')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {cards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-gold-50 rounded-lg flex items-center justify-center mb-4">
                  <card.icon size={20} className="text-gold-600" />
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{t(card.titleKey)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(card.descKey)}</p>
              </div>
            ))}
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

      {/* FAQ Preview */}
      <section className="py-16 lg:py-20 bg-white">
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
