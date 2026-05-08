import { Link } from 'react-router-dom';
import {
  ClipboardList, CreditCard, Search, Languages, FileCheck, Bell, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const steps = [
    { icon: ClipboardList, titleKey: 'how.step1.title', descKey: 'how.step1.desc' },
    { icon: CreditCard, titleKey: 'how.step2.title', descKey: 'how.step2.desc' },
    { icon: Search, titleKey: 'how.step3.title', descKey: 'how.step3.desc' },
    { icon: Languages, titleKey: 'how.step4.title', descKey: 'how.step4.desc' },
    { icon: FileCheck, titleKey: 'how.step5.title', descKey: 'how.step5.desc' },
    { icon: Bell, titleKey: 'how.step6.title', descKey: 'how.step6.desc' },
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
          <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
            {t('how.eyebrow')}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            {t('how.title')}
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {t('how.intro')}
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-navy-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <step.icon size={22} className="text-gold-400" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 mt-3 min-h-8" />
                  )}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                      {t('how.step')} {i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2">{t(step.titleKey)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(step.descKey)}</p>
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
            <h2 className="text-2xl lg:text-3xl font-bold text-navy-900 mb-2">
              {t('how.timeline.title')}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('how.timeline.sub')}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {timeline.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-6 py-4 ${
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
          <h2 className="text-2xl font-bold text-navy-900 mb-4">
            {t('how.cta.title')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('how.cta.sub')}
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-md"
          >
            {t('hero.cta.start')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
