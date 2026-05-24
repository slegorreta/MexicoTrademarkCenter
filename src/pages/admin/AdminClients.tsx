import { useEffect, useState } from 'react';
import { Search, Users, ChevronRight, Pencil, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COUNTRIES } from '../../lib/countries';

const LANG_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
];

interface EditDraft {
  legal_name: string;
  contact_person: string;
  email: string;
  phone: string;
  wechat: string;
  country: string;
  applicant_type: string;
  preferred_language: string;
}

interface DeleteConfirm {
  id: string;
  legal_name: string;
  app_count: number;
}

export default function AdminClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from('clients')
      .select('*, applications(id, payment_status)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setClients(data || []);
        setLoading(false);
      });
  }, []);

  function startEdit(c: any) {
    setEditingId(c.id);
    setEditDraft({
      legal_name: c.legal_name ?? '',
      contact_person: c.contact_person ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      wechat: c.wechat ?? '',
      country: c.country ?? '',
      applicant_type: c.applicant_type ?? 'individual',
      preferred_language: c.preferred_language ?? 'en',
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
    const { error } = await supabase.from('clients').update({
      legal_name: editDraft.legal_name || null,
      contact_person: editDraft.contact_person || null,
      email: editDraft.email || null,
      phone: editDraft.phone || null,
      wechat: editDraft.wechat || null,
      country: editDraft.country || null,
      applicant_type: editDraft.applicant_type || 'individual',
      preferred_language: editDraft.preferred_language || 'en',
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...editDraft } : c));
      setSaveMsg({ type: 'success', text: 'Saved.' });
      setTimeout(() => { setEditingId(null); setEditDraft(null); setSaveMsg(null); }, 900);
    }
    setSaving(false);
  }

  function promptDelete(c: any) {
    const paidApps = (c.applications || []).filter((a: any) => a.payment_status === 'paid');
    if (paidApps.length > 0) {
      alert(`Cannot delete ${c.legal_name}: this client has ${paidApps.length} paid application(s). Please archive or reassign them first.`);
      return;
    }
    setDeleteConfirm({ id: c.id, legal_name: c.legal_name, app_count: (c.applications || []).length });
  }

  async function confirmDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    const { error } = await supabase.from('clients').delete().eq('id', deleteConfirm.id);
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== deleteConfirm.id));
    }
    setDeleting(false);
    setDeleteConfirm(null);
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return !q || c.legal_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.country?.toLowerCase().includes(q);
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
                <h3 className="font-semibold text-gray-900">Delete Client</h3>
                <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-navy-900">{deleteConfirm.legal_name}</span>?
            </p>
            {deleteConfirm.app_count > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                This client has {deleteConfirm.app_count} unpaid application(s) that will also be deleted.
              </p>
            )}
            <div className="flex gap-3 mt-4">
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
        <h1 className="text-xl font-bold text-navy-900">Clients</h1>
        <div className="text-sm text-gray-500">{clients.length} total clients</div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-3 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Users size={28} className="mb-2" />
            <p className="text-sm">{clients.length === 0 ? 'No clients yet.' : 'No matching clients.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Name','Type','Country','Email','Phone/WeChat','Language','Apps','Since','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <>
                    <tr key={c.id} className={`transition-colors ${editingId === c.id ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <Link to={`/admin/clients/${c.id}`} className="flex items-center gap-1 group">
                          <div>
                            <div className="text-sm font-medium text-navy-900 group-hover:text-gold-600 transition-colors">{c.legal_name}</div>
                            {c.contact_person && <div className="text-xs text-gray-400">{c.contact_person}</div>}
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-gold-500 ml-1 flex-shrink-0" />
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs capitalize text-gray-600">{c.applicant_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{c.country || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{c.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{c.phone || c.wechat || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs uppercase text-gray-500">
                          {LANG_OPTIONS.find(l => l.value === c.preferred_language)?.label ?? c.preferred_language ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm text-gray-700">{c.applications?.length || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {editingId === c.id ? (
                            <>
                              <button
                                onClick={() => saveEdit(c.id)}
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
                                onClick={() => startEdit(c)}
                                className="flex items-center gap-1 text-xs font-medium text-gold-700 hover:text-gold-800 px-2 py-1.5 rounded-lg border border-gold-200 hover:border-gold-300 hover:bg-gold-50 transition-colors"
                              >
                                <Pencil size={11} />
                                Edit
                              </button>
                              <button
                                onClick={() => promptDelete(c)}
                                className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1.5 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline edit panel */}
                    {editingId === c.id && editDraft && (
                      <tr key={`${c.id}-edit`} className="bg-amber-50 border-b border-amber-100">
                        <td colSpan={9} className="px-4 pb-4 pt-1">
                          {saveMsg && (
                            <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${saveMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {saveMsg.text}
                            </div>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Legal Name</label>
                              <input type="text" className={inputCls} value={editDraft.legal_name}
                                onChange={e => setEditDraft(d => d ? { ...d, legal_name: e.target.value } : d)} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Contact Person</label>
                              <input type="text" className={inputCls} value={editDraft.contact_person}
                                onChange={e => setEditDraft(d => d ? { ...d, contact_person: e.target.value } : d)} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Email</label>
                              <input type="email" className={inputCls} value={editDraft.email}
                                onChange={e => setEditDraft(d => d ? { ...d, email: e.target.value } : d)} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Phone</label>
                              <input type="text" className={inputCls} value={editDraft.phone}
                                onChange={e => setEditDraft(d => d ? { ...d, phone: e.target.value } : d)} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">WeChat</label>
                              <input type="text" className={inputCls} value={editDraft.wechat}
                                onChange={e => setEditDraft(d => d ? { ...d, wechat: e.target.value } : d)} />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Country</label>
                              <select className={inputCls} value={editDraft.country}
                                onChange={e => setEditDraft(d => d ? { ...d, country: e.target.value } : d)}>
                                <option value="">— Select —</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Applicant Type</label>
                              <select className={inputCls} value={editDraft.applicant_type}
                                onChange={e => setEditDraft(d => d ? { ...d, applicant_type: e.target.value } : d)}>
                                <option value="individual">Individual</option>
                                <option value="company">Company</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Preferred Language</label>
                              <select className={inputCls} value={editDraft.preferred_language}
                                onChange={e => setEditDraft(d => d ? { ...d, preferred_language: e.target.value } : d)}>
                                {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
