import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import PaymentMethodIcons from '../components/PaymentMethodIcons';
import SEOHead from '../components/SEOHead';

export default function PricingPage() {
  const { t } = useLanguage();

  const features = [
    { titleKey: 'pricing.feature1.title', descKey: 'pricing.feature1.desc' },
    { titleKey: 'pricing.feature2.title', descKey: 'pricing.feature2.desc' },
    { titleKey: 'pricing.feature3.title', descKey: 'pricing.feature3.desc' },
    { titleKey: 'pricing.feature4.title', descKey: 'pricing.feature4.desc' },
    { titleKey: 'pricing.feature5.title', descKey: 'pricing.feature5.desc' },
    { titleKey: 'pricing.feature6.title', descKey: 'pricing.feature6.desc' },
  ];

  const notIncluded = [
    { labelKey: 'pricing.notIncluded1.label', noteKey: 'pricing.notIncluded1.note' },
    { labelKey: 'pricing.notIncluded2.label', noteKey: 'pricing.notIncluded2.note' },
    { labelKey: 'pricing.notIncluded3.label', noteKey: 'pricing.notIncluded3.note' },
    { labelKey: 'pricing.notIncluded4.label', noteKey: 'pricing.notIncluded4.note' },
  ];


  return (
    <div className="bg-white">
      <SEOHead
        title="Mexico Trademark Pricing — $299 All-Inclusive | IMPI Fees Included"
        description="One price for Mexico trademark registration: $299 USD per class — IMPI gov. fee of $170 + service fee + taxes. Filed in 24 business hours. No hidden costs."
        canonicalPath="/pricing"
        lang="en"
        ogLocale="en_US"
        ogImageAlt="Mexico trademark registration pricing — MexicoTrademarkCenter"
        hreflangAlternates={[]}
      />
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-gold-400 font-semibold text-sm uppercase tracking-wider mb-3">
            {t('pricing.page.eyebrow')}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-5">
            {t('pricing.page.headline')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
            {t('pricing.page.subheadline')}
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border-2 border-gold-400 shadow-2xl overflow-hidden">
            {/* Top band */}
            <div className="bg-gradient-to-r from-gold-500 to-gold-400 px-8 py-5 text-white text-center">
              <div className="text-sm font-bold uppercase tracking-widest opacity-90 mb-1">
                {t('pricing.tier1.label')}
              </div>
              <div className="text-xs opacity-75">
                {t('pricing.card.perClass')}
              </div>
            </div>

            <div className="px-8 pt-8 pb-10">
              {/* Price breakdown */}
              <div className="text-center mb-8">
                <div className="text-6xl font-bold text-navy-900 mb-2">$299</div>
                <div className="text-gray-500 text-sm mb-6">
                  {t('pricing.card.perClass')}
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('pricing.card.serviceFee')}</span>
                    <span className="font-semibold text-navy-900">USD $129</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t('pricing.card.govFee')}</span>
                    <span className="font-semibold text-navy-900">USD $170</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-navy-900">{t('pricing.card.total')}</span>
                    <span className="text-gold-600">USD $299</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-emerald-700">{t('pricing.taxesIncluded')}</p>
                    <div className="mt-3">
                      <PaymentMethodIcons size="sm" align="center" variant="dark" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-gold-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-navy-900">{t(f.titleKey)}</div>
                      <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t(f.descKey)}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                to="/apply"
                className="block text-center bg-gold-500 hover:bg-gold-600 text-white font-bold py-4 rounded-xl transition-colors shadow-md text-base"
              >
                {t('pricing.card.cta')}
                <ArrowRight size={16} className="inline ml-2" />
              </Link>

              <p className="text-center text-xs text-gray-400 mt-4">
                {t('pricing.card.stripe')}
              </p>
              <p className="text-center text-xs font-bold text-emerald-600 mt-3">{t('pricing.taxesIncluded')}</p>
              <div className="mt-4">
                <PaymentMethodIcons size="md" align="center" variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price match */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={22} className="text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-900 text-sm mb-1">
                {t('pricing.priceMatch.title')}
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                {t('pricing.priceMatch.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's not included */}
      <section className="py-12 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-lg font-bold text-navy-900 mb-6">
            {t('pricing.notIncluded.title')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {notIncluded.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                <X size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-700 font-medium">{t(item.labelKey)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{t(item.noteKey)}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-5">
            {t('pricing.notIncluded.note')}
          </p>
        </div>
      </section>


      {/* CTA */}
      <section className="py-14 bg-navy-950 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            {t('pricing.cta.title')}
          </h2>
          <p className="text-gray-400 mb-7 text-sm">
            {t('pricing.cta.sub')}
          </p>
          <Link
            to="/apply"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors shadow-lg"
          >
            {t('pricing.startFiling')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
