import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Phone, Globe, Building2, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import TrademarkStatusBadge from '../../components/TrademarkStatusBadge';

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [client, setClient] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingPortal, setCreatingPortal] = useState(false);
  const [portalMsg, setPortalMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('clients').select('*').eq('id', id).maybeSingle(),
      supabase.from('applications').select('id, case_number, filing_status, payment_status, total_classes, created_at, trademarks(mark_name)').eq('client_id', id).order('created_at', { ascending: false }),
    ]).then(([clientRes, appsRes]) => {
      const c = clientRes.data as Record<string, unknown> | null;
      setClient(c);
      setNotes(String(c?.notes ?? ''));
      setApplications((appsRes.data as Record<string, unknown>[]) ?? []);
      setLoading(false);
    });
  }, [id]);

  const saveNotes = async () => {
    setSaving(true);
    await supabase.from('clients').update({ notes }).eq('id', id!);
    setSaving(false);
  };

  const createPortalAccount = async () => {
    if (!client?.email) { setPortalMsg('Client has no email address on file.'); return; }
    setCreatingPortal(true);
    setPortalMsg('');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/create-client-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      body: JSON.stringify({ email: client.email, full_name: client.legal_name ?? client.contact_person }),
    });
    const data = await res.json();
    if (res.ok) {
      setPortalMsg(data.existing
        ? 'Client already has a portal account. Their applications have been linked.'
        : 'Portal account created. A welcome email with password setup link has been sent.');
      await supabase.from('clients').update({ user_id: data.user_id }).eq('id', id!);
      setClient(prev => prev ? { ...prev, user_id: data.user_id } : prev);
    } else {
      setPortalMsg(data.error ?? 'Failed to create portal account.');
    }
    setCreatingPortal(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!client) return <div className="text-center py-12 text-gray-500">Client not found.</div>;

  const hasPortalAccount = Boolean(client.user_id);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/clients" className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy-900">
          <ArrowLeft size={16} /> Back to Clients
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-navy-900">{String(client.legal_name ?? client.contact_person ?? '—')}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: Client profile */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-lg font-bold text-navy-700 flex-shrink-0">
                {String(client.legal_name ?? client.contact_person ?? 'C')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">{String(client.legal_name ?? '—')}</h2>
                <span className="text-xs text-gray-400 capitalize">{String(client.applicant_type ?? '')}</span>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              {[
                { icon: Mail, label: String(client.email ?? '—') },
                { icon: Phone, label: String(client.phone ?? '—') },
                { icon: Globe, label: String(client.country ?? '—') },
                { icon: Building2, label: `${String(client.city ?? '')}, ${String(client.postal_code ?? '')}` },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
                  <row.icon size={13} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{row.label}</span>
                </div>
              ))}
            </dl>
          </div>

          {/* Portal account */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Portal Access</h3>
            {hasPortalAccount ? (
              <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                Portal account active
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                No portal account yet
              </div>
            )}
            {portalMsg && (
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">{portalMsg}</p>
            )}
            <button
              onClick={createPortalAccount}
              disabled={creatingPortal}
              className="w-full flex items-center justify-center gap-2 text-sm border border-navy-200 text-navy-700 hover:bg-navy-50 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {creatingPortal ? <RefreshCw size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {hasPortalAccount ? 'Re-send Portal Access' : 'Create Portal Account'}
            </button>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
            <button
              onClick={() => navigate(`/admin/applications/new?client_id=${id}`)}
              className="w-full flex items-center justify-center gap-2 text-sm bg-navy-900 hover:bg-navy-800 text-white py-2 rounded-lg transition-colors"
            >
              <FileText size={14} /> Create Application
            </button>
          </div>
        </div>

        {/* Right: Applications + Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Applications ({applications.length})</h3>
              <button
                onClick={() => navigate(`/admin/applications/new?client_id=${id}`)}
                className="text-xs text-navy-600 hover:text-navy-900 font-medium"
              >
                + New Application
              </button>
            </div>
            {applications.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No applications yet.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Case #</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mark</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {applications.map(app => {
                    const tms = app.trademarks as Record<string, unknown>[] | Record<string, unknown> | null;
                    const tm = Array.isArray(tms) ? tms[0] : tms;
                    return (
                      <tr key={String(app.id)} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <Link to={`/admin/applications/${String(app.id)}`} className="text-xs font-mono text-navy-600 hover:text-navy-900 font-medium">
                            {String(app.case_number)}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-700">{tm ? String(tm.mark_name ?? '—') : '—'}</td>
                        <td className="px-5 py-3">
                          <TrademarkStatusBadge status={String(app.filing_status)} />
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">{new Date(String(app.created_at)).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Client Notes</h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={5}
              placeholder="Internal notes about this client…"
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-gold-400"
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 text-sm bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
