import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Globe, ChevronDown } from 'lucide-react';
import { useLanguage, Language } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'register';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'es', label: 'Español' },
];

const copy = {
  en: {
    accessSubtitle: 'Access your trademark applications',
    createSubtitle: 'Create your client account',
    fullName: 'Full Name',
    shortPassword: 'Password must be at least 6 characters.',
    invalidCredentials: 'Invalid email or password.',
    registrationFailed: 'Registration failed.',
    footerText: 'By continuing, you agree to our',
    and: 'and',
    terms: 'Terms of Service',
    privacy: 'Privacy Notice',
  },
  zh: {
    accessSubtitle: '访问您的商标申请',
    createSubtitle: '创建您的客户账户',
    fullName: '全名',
    shortPassword: '密码必须至少6个字符。',
    invalidCredentials: '无效的电子邮件或密码。',
    registrationFailed: '注册失败。',
    footerText: '继续即表示您同意我们的',
    and: '和',
    terms: '服务条款',
    privacy: '隐私通知',
  },
  es: {
    accessSubtitle: 'Accede a tus solicitudes de marca',
    createSubtitle: 'Crea tu cuenta de cliente',
    fullName: 'Nombre Completo',
    shortPassword: 'La contraseña debe tener al menos 6 caracteres.',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    registrationFailed: 'El registro falló.',
    footerText: 'Al continuar, aceptas nuestros',
    and: 'y',
    terms: 'Términos de Servicio',
    privacy: 'Aviso de Privacidad',
  },
};

export default function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const lang = (language as Language) in copy ? (language as Language) : 'en';
  const c = copy[lang];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(form.email, form.password);
      if (error) {
        setError(c.invalidCredentials);
      } else {
        // Fetch profile to determine correct redirect destination
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles').select('role').eq('id', user.id).maybeSingle();
          const staffRoles = ['super_admin', 'admin', 'docketing_staff', 'filing_staff', 'read_only'];
          if (profile && staffRoles.includes(profile.role)) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/dashboard');
        }
      }
    } else {
      if (form.password.length < 6) {
        setError(c.shortPassword);
        setLoading(false);
        return;
      }
      const { error } = await signUp(form.email, form.password, form.fullName);
      if (error) {
        setError(error.message || c.registrationFailed);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar with back button and language selector */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft size={16} />
          {language === 'zh' ? '返回首页' : language === 'es' ? 'Volver al inicio' : 'Back to Home'}
        </Link>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-navy-900 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              <Globe size={14} />
              <span className="font-medium">{LANGUAGES.find(l => l.code === language)?.label}</span>
              <ChevronDown size={12} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLanguage(l.code); setIsLangOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      language === l.code
                        ? 'text-gold-600 font-semibold bg-gold-50'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center">
                <span className="text-gold-500 font-bold text-sm">MX</span>
              </div>
              <div>
                <div className="text-navy-900 font-bold text-sm leading-tight">Mexico Trademark</div>
                <div className="text-gold-600 text-xs font-medium tracking-wide">CENTER</div>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-navy-900">
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'login' ? c.accessSubtitle : c.createSubtitle}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {c.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    value={form.fullName}
                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.email')}</label>
                <input
                  type="email"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent pr-10"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-70 mt-2"
              >
                {loading
                  ? t('auth.signingIn')
                  : mode === 'login' ? t('auth.login') : t('auth.register')}
              </button>
            </form>

            <div className="text-center mt-5 text-sm text-gray-600">
              {mode === 'login' ? (
                <>
                  {t('auth.noAccount')}{' '}
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    className="text-gold-600 font-medium hover:text-gold-700"
                  >
                    {t('auth.register')}
                  </button>
                </>
              ) : (
                <>
                  {t('auth.hasAccount')}{' '}
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className="text-gold-600 font-medium hover:text-gold-700"
                  >
                    {t('auth.login')}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Footer legal links */}
          <p className="text-center text-xs text-gray-400 mt-6">
            {c.footerText}{' '}
            <Link to="/terms" className="text-gray-500 hover:text-navy-900 underline underline-offset-2 transition-colors">
              {c.terms}
            </Link>
            {' '}{c.and}{' '}
            <Link to="/privacy" className="text-gray-500 hover:text-navy-900 underline underline-offset-2 transition-colors">
              {c.privacy}
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
