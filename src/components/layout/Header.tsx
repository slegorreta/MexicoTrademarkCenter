import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Globe, ChevronDown, LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { useLanguage, Language } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'Português' },
];

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut, isStaff } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/pricing', label: t('nav.pricing') },
    { href: '/how-it-works', label: t('nav.howItWorks') },
    { href: '/trademark-ideas', label: t('nav.ideaGenerator') },
    { href: '/faq', label: t('nav.faq') },
    { href: '/contact', label: t('nav.contact') },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 print-hide ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 lg:h-20 gap-4">
          {/* Logo — never shrinks */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-navy-900 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-gold-500 font-bold text-sm">MX</span>
            </div>
            <div className="flex-shrink-0">
              <div className="text-navy-900 font-bold text-sm sm:text-base leading-tight whitespace-nowrap">Mexico Trademark</div>
              <div className="text-gold-600 text-xs font-medium tracking-wide">CENTER</div>
            </div>
          </Link>

          {/* Desktop Nav — centered, only renders when there is genuinely enough room.
              "Preguntas Frecuentes" + "Generador de Ideas" in Spanish need ~950px of nav
              space alone, so the full layout only works at 1536px (2xl) and above. */}
          <nav className="hidden 2xl:flex items-center gap-4 flex-1 justify-center">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors whitespace-nowrap px-2 py-1 rounded ${
                  isActive(link.href)
                    ? 'text-gold-600'
                    : 'text-gray-600 hover:text-navy-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Spacer on xl so right-side controls stay right-aligned without a nav */}
          <div className="flex-1 2xl:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language dropdown */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-navy-900 transition-colors px-2 py-1 rounded hover:bg-gray-100"
              >
                <Globe size={15} />
                <span className="font-medium hidden sm:inline">
                  {LANGUAGES.find(l => l.code === language)?.label}
                </span>
                <ChevronDown size={12} className={`transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        language === lang.code
                          ? 'text-gold-600 font-semibold bg-gold-50'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative hidden 2xl:block">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-navy-900 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span className="max-w-28 truncate">
                    {profile?.full_name || profile?.email || 'Account'}
                  </span>
                  <ChevronDown size={14} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    {isStaff ? (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <Shield size={15} />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={15} />
                        {t('nav.dashboard')}
                      </Link>
                    )}
                    <button
                      onClick={() => { signOut(); setIsUserMenuOpen(false); navigate('/'); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut size={15} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden 2xl:inline-flex text-sm font-medium text-gray-600 hover:text-navy-900 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-300 transition-colors"
              >
                {t('nav.login')}
              </Link>
            )}

            <Link
              to="/apply"
              className="hidden 2xl:inline-flex bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              {t('nav.startFiling')}
            </Link>

            {/* Hamburger — visible below 2xl */}
            <button
              className="2xl:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/tablet menu — shown below 2xl */}
      {isMenuOpen && (
        <div className="2xl:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-gold-50 text-gold-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              {/* Mobile language selector */}
              <div className="flex gap-2 px-1 pb-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      language === lang.code
                        ? 'border-gold-400 bg-gold-50 text-gold-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              {!user && (
                <Link to="/login" className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  {t('nav.login')}
                </Link>
              )}
              {user && (
                <Link to={isStaff ? '/admin' : '/dashboard'} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  {isStaff ? 'Admin Dashboard' : t('nav.dashboard')}
                </Link>
              )}
              <Link to="/apply" className="block bg-gold-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg text-center">
                {t('nav.startFiling')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
