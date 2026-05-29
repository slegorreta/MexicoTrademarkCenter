import { useState, Component, type ReactNode, type ErrorInfo } from 'react';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Layout ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-gray-50">
          <p className="text-lg font-semibold text-gray-800">Something went wrong.</p>
          <p className="text-sm text-gray-500 max-w-md text-center">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            className="px-5 py-2.5 bg-[#1a2e1a] text-white rounded-xl text-sm font-semibold hover:bg-[#2d4a2d] transition-colors"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import PriceGuaranteeBadge from '../PriceGuaranteeBadge';
import { useLanguage } from '../../context/LanguageContext';

function WeChatWidget() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
      {/* Expanded panel */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${open ? 'w-52 opacity-100' : 'w-0 opacity-0'}`}>
        <div className="bg-white border border-gray-200 shadow-xl rounded-l-2xl p-4 mr-0 w-52">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700">
              {language === 'zh' ? '扫码联系我们' : 'Scan to Chat'}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <img
            src="/IMG_2221_2.jpg"
            alt="WeChat QR Code"
            className="w-full rounded-lg border border-gray-100"
          />
          <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
            {language === 'zh'
              ? '扫码添加微信，直接咨询墨西哥商标注册'
              : 'Scan to add us on WeChat for direct support'}
          </p>
        </div>
      </div>

      {/* Tab trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex flex-col items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-2 py-4 rounded-l-xl shadow-lg transition-colors"
        style={{ writingMode: 'vertical-rl' }}
        title={language === 'zh' ? '微信联系' : 'Contact via WeChat'}
      >
        {/* WeChat icon as inline SVG for authenticity */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 mb-1" style={{ writingMode: 'initial' }}>
          <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 2.532c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
        </svg>
        <span className="text-xs font-semibold tracking-wide" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          {language === 'zh' ? '微信' : 'WeChat'}
        </span>
      </button>
    </div>
  );
}

// Routes where the badge is a distractor (active clearance, filing, payment flows)
const BADGE_HIDDEN_PATHS = ['/trademark-check', '/apply', '/figurative-search'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const location = useLocation();
  const showWeChat = language === 'zh';
  const hideBadge = BADGE_HIDDEN_PATHS.some(p => location.pathname.startsWith(p));

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20">
          {children}
        </main>
        <Footer />
        {showWeChat && <WeChatWidget />}
        <PriceGuaranteeBadge variant="float" hidden={hideBadge} />
      </div>
    </ErrorBoundary>
  );
}
