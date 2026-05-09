import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, applications(case_number), clients(legal_name, country)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPayments(data || []);
        setLoading(false);
      });
  }, []);

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount_usd, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount_usd, 0);

  const statusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    paid: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
    refunded: 'bg-gray-100 text-gray-600',
    partially_refunded: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy-900">Payments</h1>
        <button
          onClick={() => { setLoading(true); supabase.from('payments').select('*, applications(case_number), clients(legal_name)').order('created_at', { ascending: false }).then(({ data }) => { setPayments(data || []); setLoading(false); }); }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-navy-900 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-900 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-gold-400" />
            <span className="text-xs text-gray-400">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-gray-500">USD confirmed</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-xs text-gray-500">Paid</span>
          </div>
          <div className="text-2xl font-bold text-navy-900">{payments.filter(p => p.status === 'paid').length}</div>
          <div className="text-xs text-gray-400">transactions</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-red-500" />
            <span className="text-xs text-gray-500">Refunded</span>
          </div>
          <div className="text-2xl font-bold text-navy-900">${totalRefunded.toFixed(2)}</div>
          <div className="text-xs text-gray-400">USD</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Case','Client','Amount','Status','Stripe ID','Date','Receipt'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-navy-900">{p.applications?.case_number || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">{p.clients?.legal_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-navy-900">${p.amount_usd?.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-400 truncate max-w-24 block">
                        {p.stripe_payment_intent_id || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.receipt_url ? (
                        <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-700 text-xs font-medium">View</a>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">No payments yet.</td>
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
