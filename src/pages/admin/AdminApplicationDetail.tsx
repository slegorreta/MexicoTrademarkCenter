import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, FileText, MessageSquare, Clock, CheckCircle2,
  Upload, Download, Eye, EyeOff, Plus, Send, RefreshCw, Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const FILING_STATUSES = [
  'new','pending_review','pending_payment','info_requested','classification_pending',
  'ready_to_file','filed','office_action_pending','office_action_responded',
  'published','opposed','registered','abandoned','closed'
];

const FILE_CATEGORIES = [
  { value: 'filing_receipt', label: 'Filing Receipt' },
  { value: 'registration_cert', label: 'Registration Certificate' },
  { value: 'office_action', label: 'Office Action' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'priority_doc', label: 'Priority Document' },
  { value: 'logo', label: 'Logo / Mark Image' },
  { value: 'other', label: 'Other' },
];

const TIMELINE_EVENT_TYPES = [
  { value: 'status_change', label: 'Status Change' },
  { value: 'document_uploaded', label: 'Document Uploaded' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'filing_instruction_sent', label: 'Filing Instructions Sent' },
  { value: 'staff_comment', label: 'Staff Comment' },
  { value: 'custom', label: 'Custom Update' },
];

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [app, setApp] = useState<Record<string, unknown> | null>(null);
  const [trademark, setTrademark] = useState<Record<string, unknown> | null>(null);
  const [classes, setClasses] = useState<Record<string, unknown>[]>([]);
  const [goodsServices, setGoodsServices] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [messages, setMessages] = useState<Record<string, unknown>[]>([]);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details'|'notes'|'messages'|'timeline'|'documents'|'instructions'>('details');

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Timeline add form
  const [tlTitle, setTlTitle] = useState('');
  const [tlDesc, setTlDesc] = useState('');
  const [tlType, setTlType] = useState('custom');
  const [tlVisible, setTlVisible] = useState(true);
  const [tlNotify, setTlNotify] = useState(false);
  const [addingTimeline, setAddingTimeline] = useState(false);

  // Document upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('filing_receipt');
  const [uploadVisible, setUploadVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Resend instruction email
  const [resending, setResending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [appRes, tmRes, classRes, gsRes, notesRes, msgsRes, tlRes, docsRes] = await Promise.all([
      supabase.from('applications').select('*, clients(*)').eq('id', id).maybeSingle(),
      supabase.from('trademarks').select('*').eq('application_id', id).maybeSingle(),
      supabase.from('trademark_classes').select('*').eq('application_id', id).order('class_number'),
      supabase.from('goods_services').select('*').eq('application_id', id).maybeSingle(),
      supabase.from('admin_notes').select('*, profiles(full_name)').eq('application_id', id).order('created_at', { ascending: false }),
      supabase.from('client_messages').select('*, profiles(full_name)').eq('application_id', id).order('created_at', { ascending: true }),
      supabase.from('timeline_events').select('*').eq('application_id', id).order('created_at', { ascending: false }),
      supabase.from('uploaded_files').select('*').eq('application_id', id).order('created_at', { ascending: false }),
    ]);
    setApp(appRes.data as Record<string, unknown> | null);
    setTrademark(tmRes.data as Record<string, unknown> | null);
    setClasses((classRes.data as Record<string, unknown>[]) || []);
    setGoodsServices(gsRes.data as Record<string, unknown> | null);
    setNotes((notesRes.data as Record<string, unknown>[]) || []);
    setMessages((msgsRes.data as Record<string, unknown>[]) || []);
    setTimeline((tlRes.data as Record<string, unknown>[]) || []);
    setDocuments((docsRes.data as Record<string, unknown>[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateApp = async (updates: Record<string, unknown>) => {
    setSaving(true);
    await supabase.from('applications').update(updates).eq('id', id!);
    setApp(prev => prev ? { ...prev, ...updates } : prev);
    setSaving(false);
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    await supabase.from('admin_notes').insert({ application_id: id!, author_id: user.id, content: newNote, is_internal: true });
    setNewNote('');
    const { data } = await supabase.from('admin_notes').select('*, profiles(full_name)').eq('application_id', id!).order('created_at', { ascending: false });
    setNotes((data as Record<string, unknown>[]) || []);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    await supabase.from('client_messages').insert({ application_id: id!, sender_id: user.id, sender_role: 'staff', content: newMessage });
    setNewMessage('');
    const { data } = await supabase.from('client_messages').select('*, profiles(full_name)').eq('application_id', id!).order('created_at', { ascending: true });
    setMessages((data as Record<string, unknown>[]) || []);
  };

  const addTimelineEvent = async () => {
    if (!tlTitle.trim() || !user) return;
    setAddingTimeline(true);
    await supabase.from('timeline_events').insert({
      application_id: id!,
      created_by: user.id,
      event_type: tlType,
      title: tlTitle,
      description: tlDesc || null,
      is_visible_to_client: tlVisible,
    });

    // Optionally notify client by email
    if (tlNotify && app?.clients) {
      const client = app.clients as Record<string, unknown>;
      if (client.email) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const { data: sessionData } = await supabase.auth.getSession();
        await fetch(`${supabaseUrl}/functions/v1/send-status-update-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData?.session?.access_token ?? anonKey}`,
          },
          body: JSON.stringify({ application_id: id, title: tlTitle, description: tlDesc }),
        }).catch(console.error);
      }
    }

    setTlTitle(''); setTlDesc(''); setTlType('custom'); setTlVisible(true); setTlNotify(false);
    const { data } = await supabase.from('timeline_events').select('*').eq('application_id', id!).order('created_at', { ascending: false });
    setTimeline((data as Record<string, unknown>[]) || []);
    setAddingTimeline(false);
  };

  const uploadDocument = async () => {
    if (!uploadFile || !user) return;
    setUploading(true);
    const ext = uploadFile.name.split('.').pop();
    const path = `${id}/${Date.now()}-${uploadFile.name}`;
    const { error: storageErr } = await supabase.storage.from('trademark-assets').upload(path, uploadFile);
    if (!storageErr) {
      await supabase.from('uploaded_files').insert({
        application_id: id!,
        uploaded_by: user.id,
        file_name: uploadFile.name,
        file_path: path,
        mime_type: uploadFile.type,
        file_size_bytes: uploadFile.size,
        category: uploadCategory,
        visible_to_client: uploadVisible,
      });
      // Add timeline event
      await supabase.from('timeline_events').insert({
        application_id: id!,
        created_by: user.id,
        event_type: 'document_uploaded',
        title: `Document uploaded: ${uploadFile.name}`,
        description: `Category: ${uploadCategory}`,
        is_visible_to_client: uploadVisible,
      });
      await load();
    }
    setUploadFile(null);
    setUploading(false);
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('trademark-assets').createSignedUrl(String(filePath), 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = String(fileName);
      a.click();
    }
  };

  const toggleDocVisibility = async (docId: string, current: boolean) => {
    await supabase.from('uploaded_files').update({ visible_to_client: !current }).eq('id', docId);
    setDocuments(prev => prev.map(d => String(d.id) === docId ? { ...d, visible_to_client: !current } : d));
  };

  const resendInstructions = async () => {
    setResending(true);
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    await fetch(`${supabaseUrl}/functions/v1/send-filing-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
      body: JSON.stringify({ application_id: id }),
    }).catch(console.error);
    setResending(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!app) return <div className="text-center py-12 text-gray-500">Application not found.</div>;

  const client = app.clients as Record<string, unknown> | null;

  const tabs = [
    { key: 'details', label: 'Details', icon: FileText },
    { key: 'timeline', label: `Timeline (${timeline.length})`, icon: Clock },
    { key: 'documents', label: `Documents (${documents.length})`, icon: Upload },
    { key: 'notes', label: `Notes (${notes.length})`, icon: Save },
    { key: 'messages', label: `Messages (${messages.length})`, icon: MessageSquare },
    { key: 'instructions', label: 'Filing Sheet', icon: CheckCircle2 },
  ] as const;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/applications" className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy-900">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-mono font-semibold text-navy-900">{String(app.case_number)}</span>
        {saving && <span className="text-xs text-gray-400 ml-auto animate-pulse">Saving…</span>}
      </div>

      {/* Status bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Filing Status</label>
          <select
            className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
            value={String(app.filing_status)}
            onChange={e => updateApp({ filing_status: e.target.value })}
          >
            {FILING_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">IMPI App Number</label>
          <input type="text" className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 w-40 focus:outline-none focus:ring-1 focus:ring-gold-400"
            defaultValue={String(app.impi_application_number ?? '')}
            onBlur={e => updateApp({ impi_application_number: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">IMPI Filing Date</label>
          <input type="date" className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
            defaultValue={String(app.impi_filing_date ?? '')}
            onBlur={e => updateApp({ impi_filing_date: e.target.value || null })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Registration Number</label>
          <input type="text" className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 w-36 focus:outline-none focus:ring-1 focus:ring-gold-400"
            defaultValue={String(app.impi_registration_number ?? '')}
            onBlur={e => updateApp({ impi_registration_number: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Reg. Date</label>
          <input type="date" className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
            defaultValue={String(app.impi_registration_date ?? '')}
            onBlur={e => updateApp({ impi_registration_date: e.target.value || null })} />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Renewal Deadline</label>
          <input type="date" className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
            defaultValue={String(app.impi_renewal_deadline ?? '')}
            onBlur={e => updateApp({ impi_renewal_deadline: e.target.value || null })} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            app.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            Payment: {String(app.payment_status)}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activeTab === tab.key ? 'border-gold-500 text-gold-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── Details ── */}
      {activeTab === 'details' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 text-sm">Applicant Information</h3>
            <div className="space-y-2">
              {client && Object.entries({
                'Legal Name': client.legal_name, 'Type': client.applicant_type,
                'Country': client.country, 'City': client.city, 'Address': client.address,
                'Postal Code': client.postal_code, 'Email': client.email,
                'Phone': client.phone, 'WeChat': client.wechat, 'Language': client.preferred_language,
              }).map(([k, v]) => v ? (
                <div key={k} className="flex gap-3">
                  <span className="text-xs text-gray-400 w-24 flex-shrink-0">{k}</span>
                  <span className="text-xs text-gray-800">{String(v)}</span>
                </div>
              ) : null)}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 text-sm">Trademark Details</h3>
            {trademark ? (
              <div className="space-y-2">
                {trademark.logo_preview_url && (
                  <img src={String(trademark.logo_preview_url)} alt="Mark" className="h-20 object-contain mb-3 rounded border border-gray-100" />
                )}
                {Object.entries({
                  'Mark Name': trademark.mark_name, 'Mark Type': trademark.mark_type,
                  'Language': trademark.mark_language, 'Spanish Meaning': trademark.meaning_spanish,
                  'Transliteration': trademark.transliteration, 'Claims Color': trademark.claims_color ? 'Yes' : 'No',
                  'Colors': trademark.color_description,
                }).map(([k, v]) => v ? (
                  <div key={k} className="flex gap-3">
                    <span className="text-xs text-gray-400 w-28 flex-shrink-0">{k}</span>
                    <span className="text-xs text-gray-800">{String(v)}</span>
                  </div>
                ) : null)}
              </div>
            ) : <p className="text-xs text-gray-400">No trademark record.</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 text-sm">Nice Classes ({classes.length})</h3>
            {classes.length > 0 ? (
              <div className="space-y-2">
                {classes.map(c => (
                  <div key={String(c.id)} className="flex items-start gap-3">
                    <span className="bg-navy-100 text-navy-700 text-xs font-bold px-2 py-0.5 rounded flex-shrink-0">Class {String(c.class_number)}</span>
                    <span className="text-xs text-gray-600">{String(c.class_title_en ?? '')}</span>
                    <span className={`ml-auto text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${c.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{String(c.status)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400">No classes.</p>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 text-sm">Goods & Services</h3>
            {goodsServices ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Original</div>
                  <p className="text-xs text-gray-800 bg-gray-50 rounded p-2">{String(goodsServices.description_original ?? '')}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Spanish <span className="text-amber-600 font-medium">({String(goodsServices.translation_status ?? '')})</span></div>
                  <textarea
                    className="w-full border border-gray-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none"
                    rows={3}
                    defaultValue={String(goodsServices.description_spanish ?? '')}
                    onBlur={async e => {
                      await supabase.from('goods_services').update({ description_spanish: e.target.value, translation_status: 'reviewed' }).eq('id', String(goodsServices.id));
                    }}
                  />
                </div>
              </div>
            ) : <p className="text-xs text-gray-400">No goods/services record.</p>}
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-navy-900 mb-4 text-sm">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Mark Ready to File', status: 'ready_to_file' },
                { label: 'Mark Filed', status: 'filed' },
                { label: 'Add Office Action', status: 'office_action_pending' },
                { label: 'Mark Published', status: 'published' },
                { label: 'Mark Registered', status: 'registered' },
                { label: 'Close Case', status: 'closed' },
              ].map(action => (
                <button key={action.status} onClick={() => updateApp({ filing_status: action.status })}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={12} />{action.label}
                </button>
              ))}
              <button onClick={() => updateApp({ payment_status: 'refunded' })}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                Issue Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Timeline ── */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Add Timeline Update</h3>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Event Type</label>
                <select value={tlType} onChange={e => setTlType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400">
                  {TIMELINE_EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Title</label>
                <input type="text" value={tlTitle} onChange={e => setTlTitle(e.target.value)}
                  placeholder="e.g. Application filed with IMPI"
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400" />
              </div>
            </div>
            <textarea value={tlDesc} onChange={e => setTlDesc(e.target.value)} rows={2}
              placeholder="Optional description visible to client…"
              className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gold-400 mb-3" />
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={tlVisible} onChange={e => setTlVisible(e.target.checked)} className="rounded" />
                Visible to client
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={tlNotify} onChange={e => setTlNotify(e.target.checked)} className="rounded" />
                Send email notification to client
              </label>
            </div>
            <button onClick={addTimelineEvent} disabled={!tlTitle.trim() || addingTimeline}
              className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              <Plus size={14} />{addingTimeline ? 'Adding…' : 'Add Update'}
            </button>
          </div>
          <div className="space-y-2">
            {timeline.map(ev => (
              <div key={String(ev.id)} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">
                  {ev.event_type === 'payment_confirmed' ? '💳' : ev.event_type === 'status_change' ? '🔄' : ev.event_type === 'document_uploaded' ? '📄' : ev.event_type === 'email_sent' ? '📧' : '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900">{String(ev.title)}</p>
                    {ev.is_visible_to_client
                      ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Client visible</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Internal</span>}
                  </div>
                  {ev.description && <p className="text-xs text-gray-600">{String(ev.description)}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(String(ev.created_at)).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {timeline.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No timeline events yet.</p>}
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-navy-900 mb-4">Upload Document</h3>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">File</label>
                <input type="file" onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gold-400">
                  {FILE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={uploadVisible} onChange={e => setUploadVisible(e.target.checked)} className="rounded" />
                Visible to client
              </label>
              <button onClick={uploadDocument} disabled={!uploadFile || uploading}
                className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
                <Upload size={14} />{uploading ? 'Uploading…' : 'Upload'}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={String(doc.id)} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText size={15} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{String(doc.file_name)}</p>
                  <p className="text-xs text-gray-400">{String(doc.category).replace(/_/g,' ')} · {((Number(doc.file_size_bytes)) / 1024).toFixed(0)} KB · {new Date(String(doc.created_at)).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleDocVisibility(String(doc.id), Boolean(doc.visible_to_client))}
                    title={doc.visible_to_client ? 'Hide from client' : 'Show to client'}
                    className={`p-1.5 rounded-lg transition-colors ${doc.visible_to_client ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
                    {doc.visible_to_client ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => downloadDocument(String(doc.file_path), String(doc.file_name))}
                    className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No documents uploaded yet.</p>}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <textarea className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-gold-400 mb-3"
              rows={3} placeholder="Add internal note…" value={newNote} onChange={e => setNewNote(e.target.value)} />
            <button onClick={addNote} className="flex items-center gap-1.5 bg-navy-900 hover:bg-navy-800 text-white text-sm px-4 py-2 rounded-lg transition-colors">
              <Save size={14} /> Add Note
            </button>
          </div>
          <div className="space-y-3">
            {notes.map(note => (
              <div key={String(note.id)} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">{String((note.profiles as Record<string,unknown>)?.full_name ?? 'Staff')}</span>
                  <span className="text-xs text-gray-400">{new Date(String(note.created_at)).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700">{String(note.content)}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No notes yet.</p>}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-96 overflow-y-auto space-y-3">
            {messages.map(msg => (
              <div key={String(msg.id)} className={`flex ${msg.sender_role === 'staff' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-sm px-4 py-2.5 rounded-xl text-sm ${msg.sender_role === 'staff' ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {String(msg.content)}
                  <div className={`text-xs mt-1 ${msg.sender_role === 'staff' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {msg.sender_role === 'staff' ? 'Staff' : 'Client'} · {new Date(String(msg.created_at)).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>}
          </div>
          <div className="flex gap-2">
            <input type="text" className="flex-1 border border-gray-200 rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-gold-400"
              placeholder="Send message to client…" value={newMessage} onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()} />
            <button onClick={sendMessage} className="bg-gold-500 hover:bg-gold-600 text-white px-4 rounded-xl transition-colors text-sm font-medium flex items-center gap-1.5">
              <Send size={14} /> Send
            </button>
          </div>
        </div>
      )}

      {/* ── Filing Instructions Sheet ── */}
      {activeTab === 'instructions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">MX Filing Instruction Checklist</h3>
            <button onClick={resendInstructions} disabled={resending}
              className="flex items-center gap-2 text-sm bg-navy-900 hover:bg-navy-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
              {resending ? 'Sending…' : 'Re-send to tm@mexicotrademarkcenter.com'}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 font-mono text-xs leading-relaxed">
            <h2 className="text-sm font-bold text-center mb-5 border-b pb-3 font-sans">Checklist of MEXICO Trademark Application for Registration</h2>
            <div className="mb-4">
              <strong>1. Our Reference:</strong> <span className="bg-yellow-50 px-2 py-0.5 rounded">{String(app.case_number)}</span>
            </div>
            <div className="mb-4">
              <strong className="text-xs">2. Applicant Details</strong>
              <table className="mt-2 w-full border-collapse border border-gray-300 text-xs">
                <tbody>
                  {[
                    ['Owner Name', client?.legal_name],
                    ['Address', client?.address],
                    ['City', client?.city],
                    ['Applicant Country', client?.country],
                    ['Entity Type', client?.applicant_type === 'company' ? 'Company' : 'Individual'],
                    ['Zip / Postal Code', client?.postal_code],
                    ['Email', client?.email],
                    ['Phone', client?.phone],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold w-40">{String(label)}</td>
                      <td className="border border-gray-300 px-3 py-1.5">{value ? String(value) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mb-4">
              <strong className="text-xs">3. Trademark Information</strong>
              <table className="mt-2 w-full border-collapse border border-gray-300 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold w-40">Trademark</td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      {trademark?.logo_preview_url
                        ? <img src={String(trademark.logo_preview_url)} alt="Mark" className="h-16 object-contain" />
                        : String(trademark?.mark_name ?? '—')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold">Trademark Pattern Color</td>
                    <td className="border border-gray-300 px-3 py-1.5">{trademark?.claims_color ? String(trademark.color_description ?? 'As shown') : 'Black and White'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold">Trademark Format</td>
                    <td className="border border-gray-300 px-3 py-1.5 capitalize">{trademark?.mark_type ? String(trademark.mark_type) : '—'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold">Statement / Slogan</td>
                    <td className="border border-gray-300 px-3 py-1.5">{trademark?.mark_type === 'slogan' ? String(trademark.mark_name ?? '—') : 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <strong className="text-xs">4. (International Classification) and Goods/Services</strong>
              <table className="mt-2 w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-3 py-1.5 text-center w-20">Class No.</th>
                    <th className="border border-gray-300 px-3 py-1.5 text-left">Classification in Spanish / Goods & Services</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map(c => (
                    <tr key={String(c.id)}>
                      <td className="border border-gray-300 px-3 py-1.5 text-center font-bold">{String(c.class_number)}</td>
                      <td className="border border-gray-300 px-3 py-1.5">{String(c.goods_services_es ?? c.goods_services_en ?? c.class_title_en ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {app.priority_claimed && (
              <div className="mt-4">
                <strong className="text-xs">5. Priority Claim</strong>
                <table className="mt-2 w-full border-collapse border border-gray-300 text-xs">
                  <tbody>
                    <tr><td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold w-40">Priority Country</td><td className="border border-gray-300 px-3 py-1.5">{String(app.priority_country ?? '—')}</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold">App. Number</td><td className="border border-gray-300 px-3 py-1.5">{String(app.priority_app_number ?? '—')}</td></tr>
                    <tr><td className="border border-gray-300 px-3 py-1.5 bg-gray-50 font-semibold">Filing Date</td><td className="border border-gray-300 px-3 py-1.5">{String(app.priority_filing_date ?? '—')}</td></tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
