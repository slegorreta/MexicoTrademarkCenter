import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, CreditCard, Clock, CheckCircle2, AlertCircle,
  TrendingUp, ArrowRight, Users, Search
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TrademarkStatusBadge from '../../components/TrademarkStatusBadge';

interface Stats {
  total: number;
  new: number;
  paid: number;
  pendingReview: number;
  readyToFile: number;
  filed: number;
  officeAction: number;
  registered: number;
  abandoned: number;
  revenue: number;
}

interface ReportStats {
  count: number;
  revenue: number;
  recent: any[];
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    total: 0, new: 0, paid: 0, pendingReview: 0,
    readyToFile: 0, filed: 0, officeAction: 0,
    registered: 0, abandoned: 0, revenue: 0,
  });
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({ count: 0, revenue: 0, recent: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('applications').select('*'),
      supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('payments').select('amount_usd').eq('status', 'paid'),
      supabase.from('clearance_report_orders').select('id, mark_name, email, final_amount_usd, paid_at, clearance_result').eq('status', 'paid').order('paid_at', { ascending: false }).limit(3),
      supabase.from('clearance_report_orders').select('final_amount_usd').eq('status', 'paid'),
    ]).then(([allRes, recentRes, paymentsRes, recentReportsRes, allReportsRes]) => {
      const all = allRes.data || [];
      setStats({
        total: all.length,
        new: all.filter(a => a.filing_status === 'new').length,
        paid: all.filter(a => a.payment_status === 'paid').length,
        pendingReview: all.filter(a => a.filing_status === 'pending_review').length,
        readyToFile: all.filter(a => a.filing_status === 'ready_to_file').length,
        filed: all.filter(a => a.filing_status === 'filed').length,
        officeAction: all.filter(a => a.filing_status === 'office_action_pending').length,
        registered: all.filter(a => a.filing_status === 'registered').length,
        abandoned: all.filter(a => a.filing_status === 'abandoned').length,
        revenue: (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount_usd || 0), 0),
      });
      setRecentApps(recentRes.data || []);
      const allReports = allReportsRes.data || [];
      setReportStats({
        count: allReports.length,
        revenue: allReports.reduce((s: number, r: any) => s + (r.final_amount_usd || 0), 0),
        recent: recentReportsRes.data || [],
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    { label: 'Total Applications', value: stats.total, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'New', value: stats.new, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Paid', value: stats.paid, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Review', value: stats.pendingReview, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Ready to File', value: stats.readyToFile, icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Filed', value: stats.filed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Office Action', value: stats.officeAction, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Registered', value: stats.registered, icon: CheckCircle2, color: 'text-green-700', bg: 'bg-green-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalRevenue = stats.revenue + reportStats.revenue;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Dashboard Overview</h1>
        <Link to="/admin/applications" className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium">
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={20} className="text-gold-400" />
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-500 text-xs mt-1">USD · All confirmed payments</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={18} className="text-green-600" />
            <span className="text-sm text-gray-500">Filing Revenue</span>
          </div>
          <div className="text-3xl font-bold text-navy-900">${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-400 text-xs mt-1">USD · Trademark filings</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Search size={18} className="text-amber-500" />
            <span className="text-sm text-gray-500">Search Report Revenue</span>
          </div>
          <div className="text-3xl font-bold text-navy-900">${reportStats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
          <div className="text-gray-400 text-xs mt-1">USD · {reportStats.count} report{reportStats.count !== 1 ? 's' : ''} sold</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
              <card.icon size={16} className={card.color} />
            </div>
            <div className="text-2xl font-bold text-navy-900">{card.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent applications */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-navy-900">Recent Applications</h2>
          <Link to="/admin/applications" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
            View all →
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={28} className="mb-2" />
            <p className="text-sm">No applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Case #','Status','Payment','Amount','Date','Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-mono font-medium text-navy-900">{app.case_number}</span>
                    </td>
                    <td className="px-5 py-3">
                      <TrademarkStatusBadge status={app.filing_status} />
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        app.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {app.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">${app.total_amount_usd?.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Link to={`/admin/applications/${app.id}`} className="text-gold-600 hover:text-gold-700 text-xs font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Search Reports */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-amber-500" />
            <h2 className="font-semibold text-navy-900">Recent Search Reports</h2>
          </div>
          <Link to="/admin/search-reports" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
            View all →
          </Link>
        </div>
        {reportStats.recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={28} className="mb-2" />
            <p className="text-sm">No reports sold yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Mark','Email','Risk','Amount','Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reportStats.recent.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-navy-900">{r.mark_name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-600">{r.email}</span>
                    </td>
                    <td className="px-5 py-3">
                      {r.clearance_result?.risk ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${RISK_COLORS[r.clearance_result.risk] || 'bg-gray-100 text-gray-600'}`}>
                          {r.clearance_result.risk}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-gray-700">${r.final_amount_usd?.toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{r.paid_at ? new Date(r.paid_at).toLocaleDateString() : '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
