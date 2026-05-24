import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowRight, RefreshCw, Pencil, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TrademarkStatusBadge from '../../components/TrademarkStatusBadge';
import { ALL_FILING_STATUSES } from '../../constants/tm5Statuses';

const STATUS_OPTIONS = ['all', ...ALL_FILING_STATUSES];
const PAYMENT_OPTIONS = ['all','pending','paid','failed','refunded'];

interface EditDraft {
  filing_status: string;
  payment_status: string;
  impi_application_number: string;
  impi_filing_date: string;
  impi_registration_number: string;
  internal_notes: string;
}

interface DeleteConfirm {
  id: string;
  case_number: string;
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('*, clients(legal_name, country, email)')
      .order('created_at', { ascending: false });
    setApplications(data || []);
    setLoading(false);
  }

  function startEdit(app: any) {
    setEditingId(app.id);
    setEditDraft({
      filing_status: app.filing_status ?? '',
      payment_status: app.payment_status ?? '',
      impi_application_number: app.impi_application_number ?? '',
      impi_filing_date: app.impi_filing_date ?? '',
      impi_registration_number: app.impi_registration_number ?? '',
      internal_notes: app.internal_notes ?? '',
    });
    setSaveMsg(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
    setSaveMsg(null);
  }

  async function saveEdit(id: string) {
    if (!editDraft) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase.from('applications').update({
      filing_status: editDraft.filing_status || null,
      payment_status: editDraft.payment_status || null,
      impi_application_number: editDraft.impi_application_number || null,
      impi_filing_date: editDraft.impi_filing_date || null,
      impi_registration_number: editDraft.impi_registration_number || null,
      internal_notes: editDraft.internal_notes || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, ...editDraft } : a));
      setSaveMsg({ type: 'success', text: 'Saved.' });
      setTimeout(() => { setEditingId(null); setEditDraft(null); setSaveMsg(null); }, 900);
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await supabase.from('applications').delete().eq('id', deleteConfirm.id);
    if (!error) {
      setApplications(prev => prev.filter(a => a.id !== deleteConfirm.id));
    }
    setDeleting(false);
    setDeleteConfirm(null);
  }

  const filtered = applications.filter(app => {
    const q = search.toLowerCase();
    const matchSearch = !q || app.case_number?.toLowerCase().includes(q) ||
      app.clients?.legal_name?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || app.filing_status === statusFilter;
    const matchPayment = paymentFilter === 'all' || app.payment_status === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const inputCls = 'w-full border border-gray-200 rounded-lg text-xs px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400 bg-white';

  return (
    <div>
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Delete Application</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-5">
              Are you sure you want to permanently delete application{' '}
              <span className="font-mono font-semibold text-navy-900">{deleteConfirm.case_number}</span>?{' '}
              All associated data including classes, timeline events, and notes will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>
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
                  {['Case #','Applicant','Country','Classes','Filing Status','Payment','Amount','Date','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(app => (
                  <>
                    <tr key={app.id} className={`transition-colors ${editingId === app.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
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
                        <div className="flex items-center gap-1.5">
                          {editingId === app.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(app.id)}
                                disabled={saving}
                                className="flex items-center gap-1 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Save size={11} />
                                {saving ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                              >
                                <X size={11} />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(app)}
                                className="flex items-center gap-1 text-xs font-medium text-gold-700 hover:text-gold-800 px-2 py-1.5 rounded-lg border border-gold-200 hover:border-gold-300 hover:bg-gold-50 transition-colors"
                              >
                                <Pencil size={11} />
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ id: app.id, case_number: app.case_number })}
                                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                              <Link
                                to={`/admin/applications/${app.id}`}
                                className="flex items-center gap-1 text-gray-400 hover:text-navy-900 text-xs px-1.5 py-1.5 transition-colors"
                              >
                                <ArrowRight size={13} />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit panel */}
                    {editingId === app.id && editDraft && (
                      <tr key={`${app.id}-edit`} className="bg-amber-50 border-b border-amber-100">
                        <td colSpan={9} className="px-4 pb-4 pt-1">
                          {saveMsg && (
                            <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {saveMsg.text}
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Filing Status</label>
                              <select
                                className={inputCls}
                                value={editDraft.filing_status}
                                onChange={e => setEditDraft(d => d ? { ...d, filing_status: e.target.value } : d)}
                              >
                                {ALL_FILING_STATUSES.map(s => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Payment Status</label>
                              <select
                                className={inputCls}
                                value={editDraft.payment_status}
                                onChange={e => setEditDraft(d => d ? { ...d, payment_status: e.target.value } : d)}
                              >
                                {['pending','paid','failed','refunded'].map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">IMPI App #</label>
                              <input
                                type="text"
                                className={inputCls}
                                value={editDraft.impi_application_number}
                                onChange={e => setEditDraft(d => d ? { ...d, impi_application_number: e.target.value } : d)}
                                placeholder="e.g. MX/A/2025/00001"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">IMPI Filing Date</label>
                              <input
                                type="date"
                                className={inputCls}
                                value={editDraft.impi_filing_date}
                                onChange={e => setEditDraft(d => d ? { ...d, impi_filing_date: e.target.value } : d)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Reg. Number</label>
                              <input
                                type="text"
                                className={inputCls}
                                value={editDraft.impi_registration_number}
                                onChange={e => setEditDraft(d => d ? { ...d, impi_registration_number: e.target.value } : d)}
                                placeholder="Registration #"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Internal Notes</label>
                              <input
                                type="text"
                                className={inputCls}
                                value={editDraft.internal_notes}
                                onChange={e => setEditDraft(d => d ? { ...d, internal_notes: e.target.value } : d)}
                                placeholder="Internal note…"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
