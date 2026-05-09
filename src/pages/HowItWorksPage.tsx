import { Link } from 'react-router-dom';
import { Shield, Tags, Languages, CreditCard, SendHorizontal as SendHorizonal, LayoutDashboard, ArrowRight, Sparkles, Clock, Receipt, Bell } from 'lucide-react';
import { useLanguage, type Language } from '../context/LanguageContext';

type BadgeMap = Record<Language, string>;

interface StepDef {
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  badge: BadgeMap;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
  highlight?: BadgeMap;
}

export default function HowItWorksPage() {
  const { t, language } = useLanguage();

  const steps: StepDef[] = [
    {
      icon: Shield,
      titleKey: 'how.step1.title',
      descKey: 'how.step1.desc',
      badge: { en: 'AI-Powered', zh: 'AI驱动', es: 'Impulsado por IA', de: 'KI-gestützt', fr: 'Propulsé par IA', hi: 'AI-संचालित', pt: 'Movido por IA', ja: 'AI搭載' },
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: Tags,
      titleKey: 'how.step2.title',
      descKey: 'how.step2.desc',
      badge: { en: '45 Nice Classes', zh: '45个尼斯分类', es: '45 Clases de Niza', de: '45 Nizza-Klassen', fr: '45 classes de Nice', hi: '45 नाइस वर्ग', pt: '45 Classes de Nice', ja: '45ニース分類' },
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      icon: Languages,
      titleKey: 'how.step3.title',
      descKey: 'how.step3.desc',
      badge: { en: 'Instant — No waiting', zh: '即时翻译', es: 'Instantáneo — Sin esperas', de: 'Sofort — Kein Warten', fr: 'Instantané — Sans attente', hi: 'तुरंत — प्रतीक्षा नहीं', pt: 'Instantâneo — Sem espera', ja: '即時翻訳' },
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      icon: CreditCard,
      titleKey: 'how.step4.title',
      descKey: 'how.step4.desc',
      badge: { en: 'Stripe — All fees included', zh: 'Stripe — 费用全包', es: 'Stripe — Todo incluido', de: 'Stripe — Alle Gebühren inklusive', fr: 'Stripe — Tous frais inclus', hi: 'Stripe — सभी शुल्क शामिल', pt: 'Stripe — Tudo incluso', ja: 'Stripe — 全費用込み' },
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
    {
      icon: SendHorizonal,
      titleKey: 'how.step5.title',
      descKey: 'how.step5.desc',
      badge: { en: 'Within 24 business hours', zh: '24工作小时内', es: 'En 24 horas hábiles', de: 'In 24 Geschäftsstunden', fr: 'En 24 heures ouvrées', hi: '24 व्यावसायिक घंटों में', pt: 'Em 24 horas úteis', ja: '24営業時間以内' },
      iconBg: 'bg-navy-50',
      iconColor: 'text-navy-700',
      badgeColor: 'bg-navy-100 text-navy-700',
      highlight: { en: 'Receipt usable for Amazon Brand Registry', zh: '收据可用于Amazon品牌注册', es: 'Acuse válido para Amazon Brand Registry', de: 'Quittung für Amazon Brand Registry nutzbar', fr: 'Reçu utilisable pour Amazon Brand Registry', hi: 'रसीद Amazon Brand Registry के लिए उपयोगी', pt: 'Recibo aceito pelo Amazon Brand Registry', ja: 'Amazonブランドレジストリで使用可能' },
    },
    {
      icon: LayoutDashboard,
      titleKey: 'how.step6.title',
      descKey: 'how.step6.desc',
      badge: { en: 'Real-time tracking', zh: '实时跟踪', es: 'Seguimiento en tiempo real', de: 'Echtzeit-Tracking', fr: 'Suivi en temps réel', hi: 'रियल-टाइम ट्रैकिंग', pt: 'Acompanhamento em tempo real', ja: 'リアルタイム追跡' },
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

  const timeline = [
    { labelKey: 'how.timeline.t1', time: 'Day 0' },
    { labelKey: 'how.timeline.t2', time: 'Day 0–1' },
    { labelKey: 'how.timeline.t3', timeKey: 'how.timeline.t3time' },
    { labelKey: 'how.timeline.t4', timeKey: 'how.timeline.t4time' },
    { labelKey: 'how.timeline.t5', timeKey: 'how.timeline.t5time' },
    { labelKey: 'how.timeline.t6', timeKey: 'how.timeline.t6time' },
    { labelKey: 'how.timeline.t7', timeKey: 'how.timeline.t7time' },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
            <Sparkles size={14} />
            {t('how.eyebrow')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            {t('how.title')}
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t('how.intro')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 group">
                {/* Icon + connector */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`relative w-14 h-14 ${step.iconBg} rounded-2xl flex items-center justify-center shadow-sm border border-white ring-4 ring-white group-hover:shadow-md transition-shadow`}>
                    <step.icon size={24} className={step.iconColor} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-navy-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-gray-200 to-gray-100 mt-2 min-h-12" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${i < steps.length - 1 ? 'pb-12' : 'pb-0'}`}>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${step.badgeColor}`}>
                      {step.badge[language] ?? step.badge['en']}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-navy-900 mb-2 leading-snug">{t(step.titleKey)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(step.descKey)}</p>
                  {step.highlight && (
                    <div className="mt-3 inline-flex items-center gap-1.5 bg-gold-50 border border-gold-200 text-gold-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                      <Receipt size={12} className="flex-shrink-0" />
                      {step.highlight[language] ?? step.highlight['en']}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-navy-700 font-semibold text-sm uppercase tracking-wider mb-3">
              <Clock size={14} />
              {t('how.timeline.title')}
            </div>
            <p className="text-gray-500 text-sm">
              {t('how.timeline.sub')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {timeline.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors ${
                i < timeline.length - 1 ? 'border-b border-gray-100' : ''
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    i === 0 ? 'border-gold-500 bg-gold-500' : i < 3 ? 'border-navy-900 bg-navy-900' : 'border-gray-300'
                  }`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <span className="text-sm text-gray-700">{t(item.labelKey)}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  i === 2 ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {item.timeKey ? t(item.timeKey) : item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-sm text-amber-800 space-y-1">
              <p>{t('disclaimer.registration')}</p>
              <p>{t('disclaimer.filing')}</p>
              <p>{t('disclaimer.classification')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <div className="inline-flex items-center gap-2 text-gold-600 font-semibold text-sm mb-4">
            <Bell size={14} />
            {t('how.cta.sub')}
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-6">
            {t('how.cta.title')}
          </h2>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            {t('hero.cta.start')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
