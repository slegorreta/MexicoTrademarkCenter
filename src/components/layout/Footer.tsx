import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';


export default function Footer() {
  const { t, language } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-gray-400 print-hide">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gold-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">MX</span>
              </div>
              <div>
                <div className="text-white font-bold text-base leading-tight">Mexico Trademark</div>
                <div className="text-gold-500 text-xs font-medium tracking-wide">CENTER</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-xs mb-4">
              {t('footer.tagline')}
            </p>
            <p className="text-xs text-gray-500">
              MexicoTrademarkCenter.com
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2">
              <li><Link to="/apply" className="text-sm hover:text-gold-400 transition-colors">{t('footer.startFiling')}</Link></li>
              <li><Link to="/pricing" className="text-sm hover:text-gold-400 transition-colors">{t('nav.pricing')}</Link></li>
              <li><Link to="/how-it-works" className="text-sm hover:text-gold-400 transition-colors">{t('nav.howItWorks')}</Link></li>
              <li><Link to="/about" className="text-sm hover:text-gold-400 transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/faq" className="text-sm hover:text-gold-400 transition-colors">{t('nav.faq')}</Link></li>
              <li><Link to="/contact" className="text-sm hover:text-gold-400 transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm hover:text-gold-400 transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="text-sm hover:text-gold-400 transition-colors">{t('footer.terms')}</Link></li>
              <li><Link to="/login" className="text-sm hover:text-gold-400 transition-colors">{t('nav.login')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact channels section — WeChat only for Chinese language */}
        {language === 'zh' && (
          <div className="border-t border-gray-800 pt-10 pb-6">
            <div className="max-w-sm mx-auto">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-navy-900 rounded-xl p-5">
                <div className="flex-shrink-0">
                  <img
                    src="/IMG_2221_2.jpg"
                    alt="WeChat QR Code"
                    className="w-24 h-24 rounded-lg border-2 border-gray-700"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="text-green-400">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 2.532c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                    </svg>
                    <h4 className="text-white font-semibold text-sm">{t('footer.wechat.title')}</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {t('footer.wechat.desc')}
                  </p>
                  <p className="text-xs text-green-400 font-medium mt-2">{t('footer.wechat.scan')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimers */}
        <div className="border-t border-gray-800 pt-8 mb-6">
          <div className="bg-navy-900 rounded-lg p-4 text-xs text-gray-500 leading-relaxed space-y-1">
            <p>{t('disclaimer.registration')}</p>
            <p>{t('disclaimer.filing')}</p>
            <p>{t('disclaimer.impi')}</p>
            <p>{t('footer.govFees')}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-600">
          <p>© {year} MexicoTrademarkCenter.com. {t('footer.rights')}</p>
          <p>{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
