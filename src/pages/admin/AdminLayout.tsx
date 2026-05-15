import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Calendar, CreditCard, Users,
  Mail, Settings, LogOut, Menu, X, Shield, Clock, UserCog, Search, BarChart2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { href: '/admin/applications', icon: FileText, label: 'Applications' },
  { href: '/admin/docketing', icon: Clock, label: 'Docketing' },
  { href: '/admin/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/search-reports', icon: Search, label: 'Search Reports' },
  { href: '/admin/clients', icon: Users, label: 'Clients' },
  { href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/admin/email-templates', icon: Mail, label: 'Email Templates' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

const superAdminItems = [
  { href: '/admin/staff', icon: UserCog, label: 'Staff Management' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-navy-950 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 h-16 border-b border-navy-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gold-500 rounded flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xs leading-tight">MTC Admin</div>
              <div className="text-gold-500 text-xs" style={{ fontSize: '10px' }}>MANAGEMENT</div>
            </div>
          </div>
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive(item.href, item.exact)
                  ? 'bg-gold-500 text-white font-medium'
                  : 'text-gray-400 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          {profile?.role === 'super_admin' && (
            <>
              <div className="px-3 pt-3 pb-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Super Admin</span>
              </div>
              {superAdminItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'bg-gold-500 text-white font-medium'
                      : 'text-gray-400 hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-navy-800">
          <div className="px-3 py-2 mb-1">
            <div className="text-white text-xs font-medium">{profile?.full_name || profile?.email}</div>
            <div className="text-gray-500 text-xs capitalize">{profile?.role?.replace('_', ' ')}</div>
          </div>
          <button
            onClick={() => { signOut(); navigate('/'); }}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-navy-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0">
          <button className="lg:hidden text-gray-600 hover:text-gray-900" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-700 ml-auto">
            ← Back to Website
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
