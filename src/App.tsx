import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Public pages
import HomePage from './pages/HomePage';
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

function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* Root: on app subdomain go straight to admin login, otherwise public home */}
      <Route path="/" element={isAppSubdomain ? <Navigate to="/admin/login" replace /> : <Layout><HomePage /></Layout>} />

      {/* Public site */}
      <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
      <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
      <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
      <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
      <Route path="/terms" element={<Layout><TermsPage /></Layout>} />

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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
