import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TrademarkStatusBadge from '../../components/TrademarkStatusBadge';
import { ALL_FILING_STATUSES } from '../../constants/tm5Statuses';

const STATUS_OPTIONS = ['all', ...ALL_FILING_STATUSES];

const PAYMENT_OPTIONS = ['all','pending','paid','failed','refunded'];

export default function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, clients(legal_name, country, email)')
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  }

  const filtered = applications.filter(app => {
    const q = search.toLowerCase();
    const matchSearch = !q || app.case_number?.toLowerCase().includes(q) ||
      app.clients?.legal_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || app.filing_status === statusFilter;
    const matchPayment = paymentFilter === 'all' || app.payment_status === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Applications</h1>
        <button onClick={fetchApplications} className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search case # or applicant..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
          >
            {PAYMENT_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Payments' : s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Case #','Applicant','Country','Classes','Filing Status','Payment','Amount','Date',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-medium text-navy-900">{app.case_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 max-w-36 truncate block">{app.clients?.legal_name || '—'}</span>
                      <span className="text-xs text-gray-400">{app.clients?.email || ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{app.clients?.country || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-700">{app.total_classes}</span>
                    </td>
                    <td className="px-4 py-3">
                      <TrademarkStatusBadge status={app.filing_status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        app.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                        app.payment_status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {app.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">${app.total_amount_usd?.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/applications/${app.id}`} className="flex items-center gap-1 text-gold-600 hover:text-gold-700 text-xs font-medium whitespace-nowrap">
                        Detail <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                      {applications.length === 0 ? 'No applications yet.' : 'No matching applications found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
