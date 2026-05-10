import { useEffect, useState } from 'react';
import { Search, TrendingUp, FileText, RefreshCw, X, ChevronDown, ChevronUp, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ReportOrder {
  id: string;
  mark_name: string;
  goods_services: string;
  language: string;
  final_amount_usd: number;
  amount_usd: number;
  discount_percent: number;
  coupon_code: string | null;
  email: string;
  status: string;
  paid_at: string | null;
  pdf_storage_path: string | null;
  created_at: string;
  clearance_result: any;
  stripe_payment_intent_id: string;
}

const LANG_LABELS: Record<string, string> = {
  en: 'English', es: 'Spanish', zh: 'Chinese', de: 'German',
  fr: 'French', hi: 'Hindi', pt: 'Portuguese', ja: 'Japanese',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function AdminClearanceReports() {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

  const fetchOrders = () => {
    setLoading(true);
    supabase
      .from('clearance_report_orders')
      .select('*')
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o =>
    !search ||
    o.mark_name.toLowerCase().includes(search.toLowerCase()) ||
    o.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((s, o) => s + (o.final_amount_usd || 0), 0);
  const thisMonth = orders.filter(o => {
    if (!o.paid_at) return false;
    const d = new Date(o.paid_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const handleDownloadPdf = async (order: ReportOrder) => {
    if (!order.pdf_storage_path) return;
    if (pdfUrls[order.id]) { window.open(pdfUrls[order.id], '_blank'); return; }
    const { data } = await supabase.storage
      .from('clearance-reports')
      .createSignedUrl(order.pdf_storage_path, 3600);
    if (data?.signedUrl) {
      setPdfUrls(prev => ({ ...prev, [order.id]: data.signedUrl }));
      window.open(data.signedUrl, '_blank');
    }
  };

  const result = (order: ReportOrder) => order.clearance_result || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Search Reports</h1>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-navy-900 rounded-xl p-5 text-white col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-gold-400" />
            <span className="text-xs text-gray-400">Report Revenue</span>
          </div>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500">USD confirmed</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-blue-600" />
            <span className="text-xs text-gray-500">Total Reports</span>
          </div>
          <div className="text-2xl font-bold text-navy-900">{orders.length}</div>
          <div className="text-xs text-gray-400">sold</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-green-600" />
            <span className="text-xs text-gray-500">This Month</span>
          </div>
          <div className="text-2xl font-bold text-navy-900">{thisMonth.length}</div>
          <div className="text-xs text-gray-400">reports</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-500" />
            <span className="text-xs text-gray-500">This Month Revenue</span>
          </div>
          <div className="text-2xl font-bold text-navy-900">
            ${thisMonth.reduce((s, o) => s + (o.final_amount_usd || 0), 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">USD</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by mark name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Table */}
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
                  {['Order Ref', 'Mark', 'Email', 'Language', 'Risk', 'Amount', 'Coupon', 'Date', 'PDF', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => (
                  <>
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-navy-900">{order.id.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-navy-900 max-w-[140px] truncate">{order.mark_name}</div>
                        <div className="text-xs text-gray-400 max-w-[140px] truncate">{order.goods_services}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{order.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{LANG_LABELS[order.language] || order.language}</span>
                      </td>
                      <td className="px-4 py-3">
                        {result(order).risk ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${RISK_COLORS[result(order).risk] || 'bg-gray-100 text-gray-600'}`}>
                            {result(order).risk}
                          </span>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-navy-900">${order.final_amount_usd?.toFixed(2)}</div>
                        {order.discount_percent > 0 && (
                          <div className="text-xs text-green-600">-{order.discount_percent}% off</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.coupon_code
                          ? <span className="text-xs font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{order.coupon_code}</span>
                          : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {order.paid_at ? new Date(order.paid_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.pdf_storage_path ? (
                          <button
                            onClick={() => handleDownloadPdf(order)}
                            className="text-gold-600 hover:text-gold-700 text-xs font-medium flex items-center gap-1"
                          >
                            <Download size={12} /> PDF
                          </button>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                          className="text-gray-400 hover:text-navy-900 transition-colors"
                        >
                          {expandedId === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`} className="bg-gray-50">
                        <td colSpan={10} className="px-6 py-5">
                          <ReportDetail order={order} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                      {search ? 'No reports match your search.' : 'No paid reports yet.'}
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

function ReportDetail({ order }: { order: ReportOrder }) {
  const r = order.clearance_result || {};

  const dupontAgainst = (r.dupont || []).filter((f: any) => f.verdict === 'against_registration').length;
  const dupontFavor = (r.dupont || []).filter((f: any) => f.verdict === 'favors_registration').length;
  const flags = r.registrabilityFlags || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Risk Summary</div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {r.riskSummary_en || r.riskSummary || 'No summary available.'}
        </p>
      </div>

      {/* Distinctiveness */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Distinctiveness</div>
        {r.distinctiveness ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold text-navy-900 capitalize">{r.distinctiveness.tier}</span>
              <span className="text-xs text-gray-400">Score {r.distinctiveness.score}/5</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{r.distinctiveness.explanation_en || r.distinctiveness.explanation}</p>
          </>
        ) : <span className="text-sm text-gray-400">No data</span>}
      </div>

      {/* DuPont */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">DuPont Factors</div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{dupontFavor}</div>
            <div className="text-xs text-gray-400">Favor</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-500">{dupontAgainst}</div>
            <div className="text-xs text-gray-400">Against</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-400">{13 - dupontFavor - dupontAgainst}</div>
            <div className="text-xs text-gray-400">Neutral</div>
          </div>
        </div>
      </div>

      {/* LFPPI Flags */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          LFPPI Flags ({flags.length})
        </div>
        {flags.length === 0
          ? <span className="text-xs text-green-600 flex items-center gap-1"><AlertCircle size={12} /> No flags raised</span>
          : flags.slice(0, 3).map((f: any, i: number) => (
            <div key={i} className="mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  f.severity === 'high' ? 'bg-red-100 text-red-700' :
                  f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-yellow-50 text-yellow-600'
                }`}>{f.severity}</span>
                <span className="text-xs text-gray-600">{f.category?.replace(/_/g, ' ')}</span>
              </div>
            </div>
          ))
        }
        {flags.length > 3 && <div className="text-xs text-gray-400">+{flags.length - 3} more</div>}
      </div>

      {/* MARCia */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">IMPI MARCia</div>
        <div className="text-2xl font-bold text-navy-900">{r.marciaTotalCount ?? 0}</div>
        <div className="text-xs text-gray-400 mb-2">potentially conflicting marks</div>
        {(r.marciaFindings || []).slice(0, 2).map((f: any, i: number) => (
          <div key={i} className="text-xs text-gray-600 truncate">{f.name} — Class {f.classNum}</div>
        ))}
      </div>

      {/* Goods/Services */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Goods &amp; Services</div>
        <p className="text-xs text-gray-700 leading-relaxed">{order.goods_services || '—'}</p>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">Stripe PI</div>
          <div className="text-xs font-mono text-gray-500 truncate">{order.stripe_payment_intent_id}</div>
        </div>
      </div>
    </div>
  );
}
