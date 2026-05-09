import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const WHATSAPP_NUMBER = '525510109843';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function Footer() {
  const { t, language } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-gray-400">
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

        {/* Contact channels section */}
        <div className="border-t border-gray-800 pt-10 pb-6">
          <div className={`grid grid-cols-1 gap-4 ${language === 'zh' ? 'sm:grid-cols-2' : 'max-w-sm mx-auto'}`}>
            {/* WeChat — only for Chinese language */}
            {language === 'zh' && (
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
            )}

            {/* WhatsApp */}
            <div className="flex flex-col items-center justify-center bg-navy-900 rounded-xl p-5 text-center">
              <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center mb-3 flex-shrink-0">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">{t('footer.whatsapp.title')}</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-3 max-w-[200px]">
                {t('footer.whatsapp.desc')}
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20b558] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {t('footer.whatsapp.cta')}
              </a>
            </div>
          </div>
        </div>

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
