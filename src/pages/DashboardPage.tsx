import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, FileText, Clock, CheckCircle2, AlertCircle, LogOut,
  ChevronRight, Download, MessageSquare, User, Settings,
  Bell, ArrowLeft, Send, Lock, Globe, Building2, RefreshCw,
  Inbox, Shield, Pencil
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppSummary {
  id: string;
  case_number: string;
  filing_status: string;
  payment_status: string;
  total_classes: number;
  created_at: string;
  trademark_name?: string;
  logo_preview_url?: string;
}

interface FilingDraft {
  id: string;
  current_step: number;
  mark_name: string | null;
  logo_preview_data: string | null;
  updated_at: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
}

interface Document {
  id: string;
  file_name: string;
  category: string;
  file_path: string;
  file_size_bytes: number;
  created_at: string;
}

interface Message {
  id: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface AppDetail {
  id: string;
  case_number: string;
  filing_status: string;
  payment_status: string;
  total_classes: number;
  created_at: string;
  impi_application_number: string | null;
  impi_filing_date: string | null;
  impi_registration_number: string | null;
  impi_registration_date: string | null;
  priority_claimed: boolean;
  priority_country: string | null;
  clients: {
    legal_name: string;
    country: string;
    city: string;
    address: string;
    postal_code: string;
    applicant_type: string;
    email: string;
    phone: string;
  } | null;
  trademarks: {
    mark_name: string;
    mark_type: string;
    claims_color: boolean;
    color_description: string | null;
    logo_preview_url: string | null;
  }[] | null;
  trademark_classes: {
    class_number: number;
    class_title_en: string;
    goods_services_en: string;
  }[] | null;
}

// ─── Status config ─────────────────────────────────────────────────────────

const FILING_STAGES = [
  { key: 'received', label: 'Received', statuses: ['new', 'pending_review', 'pending_payment'] },
  { key: 'review', label: 'Under Review', statuses: ['classification_pending', 'info_requested', 'ready_to_file'] },
  { key: 'filed', label: 'Filed', statuses: ['filed'] },
  { key: 'published', label: 'Published', statuses: ['published', 'office_action_pending'] },
  { key: 'registered', label: 'Registered', statuses: ['registered'] },
];

function getStageIndex(status: string): number {
  for (let i = 0; i < FILING_STAGES.length; i++) {
    if (FILING_STAGES[i].statuses.includes(status)) return i;
  }
  return 0;
}

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  pending_review: 'Pending Review',
  pending_payment: 'Awaiting Payment',
  info_requested: 'Info Requested',
  classification_pending: 'Classification Pending',
  ready_to_file: 'Ready to File',
  filed: 'Filed',
  office_action_pending: 'Office Action',
  published: 'Published',
  registered: 'Registered',
  abandoned: 'Abandoned',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  pending_review: 'bg-amber-100 text-amber-700',
  pending_payment: 'bg-orange-100 text-orange-700',
  info_requested: 'bg-rose-100 text-rose-700',
  classification_pending: 'bg-sky-100 text-sky-700',
  ready_to_file: 'bg-teal-100 text-teal-700',
  filed: 'bg-green-100 text-green-700',
  office_action_pending: 'bg-red-100 text-red-700',
  published: 'bg-cyan-100 text-cyan-700',
  registered: 'bg-emerald-100 text-emerald-700',
  abandoned: 'bg-gray-100 text-gray-500',
};

const TIMELINE_ICONS: Record<string, string> = {
  payment_confirmed: '💳',
  status_change: '🔄',
  document_uploaded: '📄',
  email_sent: '📧',
  filing_instruction_sent: '📨',
  staff_comment: '💬',
  custom: '📌',
};

// ─── Sub-components ────────────────────────────────────────────────────────

function StageProgress({ status }: { status: string }) {
  const current = getStageIndex(status);
  return (
    <div className="flex items-center gap-0 w-full">
      {FILING_STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-[#1a2e1a] text-white' : active ? 'bg-[#2d5a2d] text-white ring-2 ring-[#2d5a2d] ring-offset-2' : 'bg-gray-200 text-gray-400'}`}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight hidden sm:block
                ${active ? 'text-[#1a2e1a] font-semibold' : done ? 'text-gray-500' : 'text-gray-400'}`}>
                {stage.label}
              </span>
            </div>
            {i < FILING_STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${i < current ? 'bg-[#1a2e1a]' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AppCard({ app, onClick }: { app: AppSummary; onClick: () => void }) {
  const statusColor = STATUS_COLORS[app.filing_status] ?? 'bg-gray-100 text-gray-600';
  const statusLabel = STATUS_LABELS[app.filing_status] ?? app.filing_status;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-[#2d5a2d] hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {app.logo_preview_url
            ? <img src={app.logo_preview_url} alt="" className="w-full h-full object-contain" />
            : <Shield size={20} className="text-[#2d5a2d]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">
              {app.trademark_name || 'Untitled Mark'}
            </span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2d5a2d] flex-shrink-0 transition-colors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs font-mono text-gray-500">{app.case_number}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{app.total_classes} class{app.total_classes !== 1 ? 'es' : ''}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <StageProgress status={app.filing_status} />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
          {statusLabel}
        </span>
        {app.payment_status === 'pending' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            Payment Pending
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Application Detail View ──────────────────────────────────────────────

function ApplicationDetail({ appId, onBack }: { appId: string; onBack: () => void }) {
  const { user } = useAuth();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'timeline' | 'documents' | 'messages' | 'info'>('timeline');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [appRes, timelineRes, docsRes, msgsRes] = await Promise.all([
      supabase
        .from('applications')
        .select('*, clients(*), trademarks(*), trademark_classes(*)')
        .eq('id', appId)
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase
        .from('timeline_events')
        .select('id, event_type, title, description, created_at')
        .eq('application_id', appId)
        .eq('is_visible_to_client', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('uploaded_files')
        .select('id, file_name, category, file_path, file_size_bytes, created_at')
        .eq('application_id', appId)
        .eq('visible_to_client', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('client_messages')
        .select('id, sender_role, content, is_read, created_at')
        .eq('application_id', appId)
        .order('created_at', { ascending: true }),
    ]);
    setApp(appRes.data as AppDetail | null);
    setTimeline(timelineRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setMessages(msgsRes.data ?? []);
    setLoading(false);
  }, [appId, user]);

  useEffect(() => { load(); }, [load]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from('client_messages').insert({
      application_id: appId,
      sender_id: user.id,
      sender_role: 'client',
      content: newMessage.trim(),
    });
    setNewMessage('');
    await load();
    setSending(false);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('trademark-assets').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      a.click();
    }
  };

  const trademark = Array.isArray(app?.trademarks) ? app!.trademarks[0] : app?.trademarks;
  const classes = app?.trademark_classes ?? [];
  const currentStageIndex = app ? getStageIndex(app.filing_status) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#2d5a2d] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!app) return (
    <div className="text-center py-24 text-gray-500">Application not found.</div>
  );

  const tabs = [
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'info', label: 'My Info', icon: User },
  ] as const;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={15} /> Back to Applications
        </button>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center overflow-hidden flex-shrink-0">
            {trademark?.logo_preview_url
              ? <img src={trademark.logo_preview_url} alt="" className="w-full h-full object-contain" />
              : <Shield size={22} className="text-[#2d5a2d]" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{trademark?.mark_name ?? 'Trademark Application'}</h2>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-sm font-mono text-gray-500">{app.case_number}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.filing_status] ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_LABELS[app.filing_status] ?? app.filing_status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Prosecution Progress</p>
          <StageProgress status={app.filing_status} />
          <p className="text-xs text-[#2d5a2d] mt-3 font-medium">
            Currently: {FILING_STAGES[currentStageIndex]?.label}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-md text-xs font-medium transition-all
              ${tab === t.key ? 'bg-white text-[#1a2e1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={13} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Timeline */}
      {tab === 'timeline' && (
        <div className="space-y-3">
          {timeline.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <Clock size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No updates yet. We'll post progress here as your application advances.</p>
            </div>
          ) : timeline.map(ev => (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
              <div className="text-xl flex-shrink-0 mt-0.5">{TIMELINE_ICONS[ev.event_type] ?? '📌'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{ev.title}</p>
                {ev.description && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{ev.description}</p>}
                <p className="text-xs text-gray-400 mt-2">{new Date(ev.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents */}
      {tab === 'documents' && (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No documents available yet. Official documents will appear here once filed.</p>
            </div>
          ) : documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f7f0] flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-[#2d5a2d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {doc.category.replace(/_/g, ' ')} · {(doc.file_size_bytes / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => downloadFile(doc.file_path, doc.file_name)}
                className="flex items-center gap-1.5 text-xs text-[#2d5a2d] hover:text-[#1a2e1a] font-medium transition-colors"
              >
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      {tab === 'messages' && (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: 400 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 400 }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <Inbox size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No messages yet. Send us a message below.</p>
              </div>
            ) : messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.sender_role === 'client'
                    ? 'bg-[#1a2e1a] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                  {msg.content}
                  <p className={`text-[10px] mt-1 ${msg.sender_role === 'client' ? 'text-green-300' : 'text-gray-400'}`}>
                    {msg.sender_role === 'client' ? 'You' : 'MTC Team'} · {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-3 flex gap-2">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message to our team..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d] focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
              className="w-9 h-9 bg-[#1a2e1a] text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#2d5a2d] transition-colors"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {/* My Info */}
      {tab === 'info' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={15} className="text-[#2d5a2d]" /> Applicant Details
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Owner Name', app.clients?.legal_name],
                ['Entity Type', app.clients?.applicant_type === 'company' ? 'Company' : 'Individual'],
                ['Country', app.clients?.country],
                ['City', app.clients?.city],
                ['Address', app.clients?.address],
                ['Postal Code', app.clients?.postal_code],
                ['Email', app.clients?.email],
                ['Phone', app.clients?.phone],
              ].map(([label, value]) => value ? (
                <div key={label}>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="text-gray-800 font-medium mt-0.5">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={15} className="text-[#2d5a2d]" /> Trademark Details
            </h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><dt className="text-gray-400 text-xs uppercase tracking-wide">Mark Name</dt><dd className="text-gray-800 font-medium mt-0.5">{trademark?.mark_name ?? '—'}</dd></div>
              <div><dt className="text-gray-400 text-xs uppercase tracking-wide">Mark Type</dt><dd className="text-gray-800 font-medium mt-0.5 capitalize">{trademark?.mark_type ?? '—'}</dd></div>
              <div><dt className="text-gray-400 text-xs uppercase tracking-wide">Color Claim</dt><dd className="text-gray-800 font-medium mt-0.5">{trademark?.claims_color ? 'Yes' : 'No'}</dd></div>
              <div><dt className="text-gray-400 text-xs uppercase tracking-wide">Classes</dt><dd className="text-gray-800 font-medium mt-0.5">{app.total_classes}</dd></div>
            </dl>
            {classes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Nice Classes</p>
                <div className="space-y-1.5">
                  {classes.map(c => (
                    <div key={c.class_number} className="flex gap-2 text-sm">
                      <span className="w-16 flex-shrink-0 font-mono text-[#2d5a2d] font-semibold">Class {c.class_number}</span>
                      <span className="text-gray-600">{c.class_title_en}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {app.impi_application_number && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div><dt className="text-gray-400 text-xs uppercase tracking-wide">IMPI App. No.</dt><dd className="text-gray-800 font-medium font-mono mt-0.5">{app.impi_application_number}</dd></div>
                {app.impi_filing_date && <div><dt className="text-gray-400 text-xs uppercase tracking-wide">IMPI Filing Date</dt><dd className="text-gray-800 font-medium mt-0.5">{new Date(app.impi_filing_date).toLocaleDateString()}</dd></div>}
                {app.impi_registration_number && <div><dt className="text-gray-400 text-xs uppercase tracking-wide">Reg. Number</dt><dd className="text-gray-800 font-medium font-mono mt-0.5">{app.impi_registration_number}</dd></div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Account Settings View ────────────────────────────────────────────────

function AccountSettings() {
  const { user, profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    if (newPassword.length < 8) { setMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      if (profile) {
        await supabase.from('profiles').update({ password_change_required: false }).eq('id', user!.id);
      }
    }
    setSaving(false);
  };

  const sendResetEmail = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });
    setResetSent(true);
    setResetLoading(false);
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={15} className="text-[#2d5a2d]" /> Profile
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{profile?.full_name ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{user?.email}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={15} className="text-[#2d5a2d]" /> Change Password
        </h3>
        {msg && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d]"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d]"
              placeholder="Repeat new password"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={saving}
            className="w-full bg-[#1a2e1a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5a2d] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Update Password'}
          </button>
          <div className="pt-1 border-t border-gray-100 text-center">
            {resetSent ? (
              <p className="text-xs text-green-600 font-medium">Reset link sent to {user?.email}</p>
            ) : (
              <button
                type="button"
                onClick={sendResetEmail}
                disabled={resetLoading}
                className="text-xs text-gray-400 hover:text-[#2d5a2d] transition-colors disabled:opacity-50"
              >
                {resetLoading ? 'Sending…' : 'Or send a reset link to my email'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────

type View = 'applications' | 'detail' | 'settings';

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const [applications, setApplications] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(params.id ? 'detail' : 'applications');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(params.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draft, setDraft] = useState<FilingDraft | null>(null);

  // Force password change if required
  useEffect(() => {
    if (profile?.password_change_required) {
      setView('settings');
    }
  }, [profile]);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [appsRes, draftRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id, case_number, filing_status, payment_status, total_classes, created_at, trademarks(mark_name, logo_preview_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('filing_drafts')
        .select('id, current_step, mark_name, logo_preview_data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const apps: AppSummary[] = (appsRes.data ?? []).map((a: Record<string, unknown>) => {
      const tms = a.trademarks as Record<string, unknown>[] | Record<string, unknown> | null;
      const tm = Array.isArray(tms) ? tms[0] : tms;
      return {
        id: String(a.id),
        case_number: String(a.case_number),
        filing_status: String(a.filing_status),
        payment_status: String(a.payment_status),
        total_classes: Number(a.total_classes),
        created_at: String(a.created_at),
        trademark_name: tm ? String(tm.mark_name ?? '') : undefined,
        logo_preview_url: tm ? (tm.logo_preview_url ? String(tm.logo_preview_url) : undefined) : undefined,
      };
    });
    setApplications(apps);
    setDraft(draftRes.data as FilingDraft | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const openApp = (id: string) => {
    setSelectedAppId(id);
    setView('detail');
    setSidebarOpen(false);
  };

  const stats = [
    { label: 'Total', value: applications.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'In Progress', value: applications.filter(a => ['new','pending_review','filed','ready_to_file'].includes(a.filing_status)).length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Registered', value: applications.filter(a => a.filing_status === 'registered').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Action Needed', value: applications.filter(a => ['info_requested','office_action_pending','pending_payment'].includes(a.filing_status)).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const navItems = [
    { key: 'applications', label: 'My Applications', icon: FileText },
    { key: 'settings', label: 'Account Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0f1f0f] text-white flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#c9a84c] rounded flex items-center justify-center">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Mexico Trademark</p>
              <p className="text-[10px] text-green-400 mt-0.5">Client Portal</p>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2d5a2d] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Client'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {profile?.password_change_required && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/30 rounded-lg px-2.5 py-1.5">
              <Bell size={11} /> Please set your password
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => { setView(item.key as View); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${view === item.key || (item.key === 'applications' && view === 'detail')
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}

          <Link
            to="/apply"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors mt-1"
          >
            <Plus size={16} /> New Filing
          </Link>
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-rose-400 transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <div className="space-y-1">
              <div className="w-5 h-0.5 bg-gray-600 rounded" />
              <div className="w-5 h-0.5 bg-gray-600 rounded" />
              <div className="w-5 h-0.5 bg-gray-600 rounded" />
            </div>
          </button>
          <span className="text-sm font-semibold text-gray-800">Client Portal</span>
          <div className="w-8 h-8 rounded-full bg-[#2d5a2d] flex items-center justify-center text-xs font-bold text-white">{initials}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Applications list view */}
          {view === 'applications' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Track your trademark filings in real time</p>
                </div>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={15} /> New Filing
                </Link>
              </div>

              {/* In-progress draft banner */}
              {draft && (
                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {draft.logo_preview_data
                      ? <img src={draft.logo_preview_data} alt="" className="w-full h-full object-contain" />
                      : <Pencil size={18} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">
                      {draft.mark_name ? `"${draft.mark_name}" — ` : ''}Draft Filing in Progress
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Step {draft.current_step} of 6 &middot; Last saved {new Date(draft.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to="/apply?resume=1"
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      Continue <ChevronRight size={13} />
                    </Link>
                    <Link
                      to="/apply?fresh=1"
                      className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                    >
                      Start new
                    </Link>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {stats.map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                      <s.icon size={15} className={s.color} />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* App cards */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2d5a2d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-[#f0f7f0] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield size={24} className="text-[#2d5a2d]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">No applications yet</h3>
                  <p className="text-sm text-gray-500 mb-5">Start your first Mexico trademark filing today.</p>
                  <Link
                    to="/apply"
                    className="inline-flex items-center gap-2 bg-[#1a2e1a] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#2d5a2d] transition-colors"
                  >
                    <Plus size={15} /> Start First Filing
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <AppCard key={app.id} app={app} onClick={() => openApp(app.id)} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Application detail view */}
          {view === 'detail' && selectedAppId && (
            <ApplicationDetail
              appId={selectedAppId}
              onBack={() => { setView('applications'); setSelectedAppId(null); }}
            />
          )}

          {/* Account settings */}
          {view === 'settings' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
                {profile?.password_change_required && (
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Bell size={14} /> Please set a personal password to secure your account.
                  </div>
                )}
              </div>
              <AccountSettings />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
