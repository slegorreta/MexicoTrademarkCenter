import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider, type Language } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { detectLanguageFromIp } from './lib/ipLanguage';
import Layout from './components/layout/Layout';

// Public pages
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import PricingPage from './pages/PricingPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

// Auth & client
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplyPage from './pages/ApplyPage';
import TrademarkIdeaPage from './pages/TrademarkIdeaPage';
import TrademarkCheckPage from './pages/TrademarkCheckPage';
import FigurativeSearchPage from './pages/FigurativeSearchPage';

// Homepage V2 preview
import HomePageV2 from './pages/HomePageV2';
import PreviewPage from './pages/PreviewPage';

// Admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminApplications from './pages/admin/AdminApplications';
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail';
import AdminNewApplication from './pages/admin/AdminNewApplication';
import AdminDocketing from './pages/admin/AdminDocketing';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminPayments from './pages/admin/AdminPayments';
import AdminClients from './pages/admin/AdminClients';
import AdminClientDetail from './pages/admin/AdminClientDetail';
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates';
import AdminSettings from './pages/admin/AdminSettings';
import AdminStaffManagement from './pages/admin/AdminStaffManagement';
import AdminClearanceReports from './pages/admin/AdminClearanceReports';
import AdminVideoUpload from './pages/admin/AdminVideoUpload';
import AdminStatusGuide from './pages/admin/AdminStatusGuide';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ProtectedRoute({ children, requireStaff = false }: { children: React.ReactNode; requireStaff?: boolean }) {
  const { user, loading, isStaff } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={requireStaff ? '/admin/login' : '/login'} replace />;
  // Staff trying to access client dashboard → redirect to admin
  if (!requireStaff && isStaff) return <Navigate to="/admin" replace />;
  // Non-staff trying to access admin → redirect to client dashboard
  if (requireStaff && !isStaff) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const isAppSubdomain = window.location.hostname === 'app.mexicotrademarkcenter.com';

const LANG_ROUTES: Record<string, Language> = {
  '/es/': 'es', '/en/': 'en', '/zh/': 'zh', '/pt/': 'pt',
  '/de/': 'de', '/fr/': 'fr', '/hi/': 'hi', '/ja/': 'ja',
};

function detectInitialLang(): Language | undefined {
  const path = window.location.pathname;
  return LANG_ROUTES[path] ?? LANG_ROUTES[path.endsWith('/') ? path : `${path}/`];
}

const LANG_PREFIXES = Object.keys(LANG_ROUTES).map(k => k.replace(/\//g, ''));

function IpLanguageRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const path = window.location.pathname;
    // If already on a language landing page, save that explicit choice and skip
    const onLangPage = LANG_PREFIXES.some(p => path === `/${p}` || path === `/${p}/`);
    if (onLangPage) {
      const lang = detectInitialLang();
      if (lang) localStorage.setItem('mtc_lang', lang);
      return;
    }
    // Only redirect root '/' visits with no stored preference
    if (path !== '/') return;
    if (localStorage.getItem('mtc_lang')) return;
    detectLanguageFromIp().then(lang => {
      if (lang !== 'en') {
        localStorage.setItem('mtc_lang', lang);
        navigate(`/${lang}/`, { replace: true });
      }
    });
  }, [navigate]);

  return null;
}

function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <IpLanguageRedirect />
    <Routes>
      {/* Root: on app subdomain go straight to admin login, otherwise public home */}
      <Route path="/" element={isAppSubdomain ? <Navigate to="/admin/login" replace /> : <Layout><HomePage /></Layout>} />

      {/* Homepage V2 preview */}
      <Route path="/preview" element={<Layout><PreviewPage /></Layout>} />
      <Route path="/preview-v2" element={<Layout><HomePageV2 /></Layout>} />

      {/* Public site */}
      <Route path="/about" element={<Layout><AboutPage /></Layout>} />
      <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
      <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />

      {/* SEO Landing pages — one per language (with and without trailing slash) */}
      <Route path="/es" element={<Layout><LandingPage lang="es" /></Layout>} />
      <Route path="/es/" element={<Layout><LandingPage lang="es" /></Layout>} />
      <Route path="/en" element={<Layout><LandingPage lang="en" /></Layout>} />
      <Route path="/en/" element={<Layout><LandingPage lang="en" /></Layout>} />
      <Route path="/zh" element={<Layout><LandingPage lang="zh" /></Layout>} />
      <Route path="/zh/" element={<Layout><LandingPage lang="zh" /></Layout>} />
      <Route path="/pt" element={<Layout><LandingPage lang="pt" /></Layout>} />
      <Route path="/pt/" element={<Layout><LandingPage lang="pt" /></Layout>} />
      <Route path="/de" element={<Layout><LandingPage lang="de" /></Layout>} />
      <Route path="/de/" element={<Layout><LandingPage lang="de" /></Layout>} />
      <Route path="/fr" element={<Layout><LandingPage lang="fr" /></Layout>} />
      <Route path="/fr/" element={<Layout><LandingPage lang="fr" /></Layout>} />
      <Route path="/hi" element={<Layout><LandingPage lang="hi" /></Layout>} />
      <Route path="/hi/" element={<Layout><LandingPage lang="hi" /></Layout>} />
      <Route path="/ja" element={<Layout><LandingPage lang="ja" /></Layout>} />
      <Route path="/ja/" element={<Layout><LandingPage lang="ja" /></Layout>} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/staff" element={<AdminLoginPage />} />

      {/* Apply */}
      <Route path="/apply" element={<Layout><ApplyPage /></Layout>} />

      {/* Trademark Idea Generator */}
      <Route path="/trademark-ideas" element={<Layout><TrademarkIdeaPage /></Layout>} />

      {/* Free Trademark Check */}
      <Route path="/trademark-check" element={<Layout><TrademarkCheckPage /></Layout>} />

      {/* Figurative / Design Trademark Search */}
      <Route path="/figurative-search" element={<Layout><FigurativeSearchPage /></Layout>} />

      {/* Client dashboard — has its own layout (sidebar), no Layout wrapper */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/application/:id"
        element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminOverview /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/applications"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminApplications /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/applications/:id"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminApplicationDetail /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/docketing"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminDocketing /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/calendar"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminCalendar /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/payments"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminPayments /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/search-reports"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminClearanceReports /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/clients"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminClients /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/clients/:id"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminClientDetail /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/applications/new"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminNewApplication /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/staff"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminStaffManagement /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/email-templates"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminEmailTemplates /></AdminLayout></ProtectedRoute>}
      />
      <Route
        path="/admin/settings"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>}
      />

      <Route
        path="/admin/status-guide"
        element={<ProtectedRoute requireStaff><AdminLayout><AdminStatusGuide /></AdminLayout></ProtectedRoute>}
      />

      {/* Video upload utility */}
      <Route path="/admin/upload-video" element={<AdminVideoUpload />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider initialLang={detectInitialLang()}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
