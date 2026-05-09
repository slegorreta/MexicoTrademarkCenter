import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, FileText, Clock, CheckCircle2, AlertCircle, LogOut,
  ChevronRight, Download, MessageSquare, User, Settings,
  Bell, ArrowLeft, Send, Lock, Globe, Building2, RefreshCw,
  Inbox, Shield, Pencil, CreditCard, Loader2, Tag, X,
  Printer, Sheet, Calendar, Hash, Award, BarChart3
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ─── Stripe singleton ─────────────────────────────────────────────────────────
const stripePromise = (() => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return key ? loadStripe(key) : null;
})();

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
  // Docket fields
  impi_application_number?: string | null;
  impi_filing_date?: string | null;
  impi_publication_date?: string | null;
  impi_registration_number?: string | null;
  impi_registration_date?: string | null;
  impi_renewal_deadline?: string | null;
  class_titles?: string;
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
  total_amount_usd: number | null;
  service_fee_usd: number | null;
  government_fee_usd: number | null;
  created_at: string;
  impi_application_number: string | null;
  impi_filing_date: string | null;
  impi_publication_date: string | null;
  impi_registration_number: string | null;
  impi_registration_date: string | null;
  impi_renewal_deadline: string | null;
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
    logo_file_path: string | null;
  }[] | null;
  trademark_classes: {
    class_number: number;
    class_title_en: string;
    goods_services_en: string;
  }[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtShort(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
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

// ─── Export utilities ─────────────────────────────────────────────────────────

function exportToCSV(rows: AppSummary[], filename: string) {
  const headers = [
    'Mark Name', 'Internal Case No.', 'Classes', 'Status',
    'Date Filed', 'IMPI App. No.', 'IMPI Filing Date',
    'Publication Date', 'IMPI Reg. No.', 'Registration Date', 'Renewal Deadline',
  ];
  const lines = rows.map(r => [
    r.trademark_name ?? '',
    r.case_number,
    String(r.total_classes),
    STATUS_LABELS[r.filing_status] ?? r.filing_status,
    fmtShort(r.created_at),
    r.impi_application_number ?? '',
    fmtShort(r.impi_filing_date),
    fmtShort(r.impi_publication_date),
    r.impi_registration_number ?? '',
    fmtShort(r.impi_registration_date),
    fmtShort(r.impi_renewal_deadline),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportSingleToCSV(app: AppDetail, filename: string) {
  const trademark = Array.isArray(app.trademarks) ? app.trademarks[0] : app.trademarks;
  const classes = (app.trademark_classes ?? []).map(c => `Class ${c.class_number} – ${c.class_title_en}`).join('; ');
  const rows = [
    ['Field', 'Value'],
    ['Mark Name', trademark?.mark_name ?? ''],
    ['Mark Type', trademark?.mark_type ?? ''],
    ['Internal Case No.', app.case_number],
    ['Filing Status', STATUS_LABELS[app.filing_status] ?? app.filing_status],
    ['Nice Classes', classes],
    ['Date Submitted', fmtShort(app.created_at)],
    ['IMPI Application No.', app.impi_application_number ?? ''],
    ['IMPI Filing Date', fmtShort(app.impi_filing_date)],
    ['Publication Date', fmtShort(app.impi_publication_date)],
    ['IMPI Registration No.', app.impi_registration_number ?? ''],
    ['Registration Date', fmtShort(app.impi_registration_date)],
    ['Renewal / Expiration', fmtShort(app.impi_renewal_deadline)],
    ['Applicant', app.clients?.legal_name ?? ''],
    ['Country', app.clients?.country ?? ''],
    ['Email', app.clients?.email ?? ''],
  ];
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

// ─── Stripe checkout form ─────────────────────────────────────────────────────

function DashboardCheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setPaying(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || paying}
        className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
      >
        {paying ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
        {paying ? 'Processing...' : 'Confirm Payment'}
      </button>
      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
        <Lock size={11} /> Secured by Stripe
      </p>
    </form>
  );
}

// ─── Docket row in list view ──────────────────────────────────────────────────

function DocketField({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">{label}</dt>
      <dd className={`text-xs mt-0.5 truncate ${value && value !== '—' ? (mono ? 'font-mono text-gray-800 font-semibold' : 'text-gray-700') : 'text-gray-300 italic'}`}>
        {value && value !== '—' ? value : '—'}
      </dd>
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
      {/* Top row: logo + name + case + status */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {app.logo_preview_url
            ? <img src={app.logo_preview_url} alt="" className="w-full h-full object-contain" />
            : <Shield size={20} className="text-[#2d5a2d]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate text-base">
              {app.trademark_name || 'Untitled Mark'}
            </span>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2d5a2d] flex-shrink-0 transition-colors" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {statusLabel}
            </span>
            {app.payment_status === 'pending' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-orange-600 text-white group-hover:bg-orange-700 transition-colors">
                <CreditCard size={10} /> Complete Payment
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Docket grid */}
      <dl className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
        <DocketField label="Case No." value={app.case_number} mono />
        <DocketField label="Classes" value={String(app.total_classes)} />
        <DocketField label="Date Filed" value={fmt(app.created_at)} />
        <DocketField label="IMPI App. No." value={app.impi_application_number} mono />
        <DocketField label="Publication" value={fmt(app.impi_publication_date)} />
        <DocketField label="Registration" value={fmt(app.impi_registration_date)} />
        <DocketField label="IMPI Reg. No." value={app.impi_registration_number} mono />
        <DocketField label="Renewal / Exp." value={fmt(app.impi_renewal_deadline)} />
      </dl>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <StageProgress status={app.filing_status} />
      </div>
    </button>
  );
}

// ─── Filing Particulars card (inside detail view) ─────────────────────────────

function FilingParticularsCard({ app, printRef }: { app: AppDetail; printRef: React.RefObject<HTMLDivElement | null> }) {
  const trademark = Array.isArray(app.trademarks) ? app.trademarks[0] : app.trademarks;
  const classes = app.trademark_classes ?? [];

  const fields: [string, string | null | undefined, boolean?][] = [
    ['Mark Name', trademark?.mark_name, false],
    ['Mark Type', trademark?.mark_type ? trademark.mark_type.charAt(0).toUpperCase() + trademark.mark_type.slice(1) : null, false],
    ['Internal Case No.', app.case_number, true],
    ['Filing Status', STATUS_LABELS[app.filing_status] ?? app.filing_status, false],
    ['Nice Classes', String(app.total_classes), false],
    ['Date Submitted', fmt(app.created_at), false],
    ['IMPI Application No.', app.impi_application_number, true],
    ['IMPI Filing Date', fmt(app.impi_filing_date), false],
    ['Publication Date', fmt(app.impi_publication_date), false],
    ['IMPI Registration No.', app.impi_registration_number, true],
    ['Registration Date', fmt(app.impi_registration_date), false],
    ['Renewal / Expiration', fmt(app.impi_renewal_deadline), false],
  ];

  return (
    <div ref={printRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-[#f8fdf8]">
        {trademark?.logo_preview_url ? (
          <img src={trademark.logo_preview_url} alt="" className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-[#2d5a2d]" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base">{trademark?.mark_name ?? 'Trademark Application'}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-mono text-gray-500">{app.case_number}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.filing_status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[app.filing_status] ?? app.filing_status}
            </span>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-gray-100">
        {fields.map(([label, value, mono]) => (
          <div key={label} className="bg-white px-4 py-3">
            <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold mb-1">{label}</dt>
            <dd className={`text-sm font-medium ${value && value !== '—' ? (mono ? 'font-mono text-[#1a2e1a]' : 'text-gray-800') : 'text-gray-300 italic text-xs'}`}>
              {value && value !== '—' ? value : '—'}
            </dd>
          </div>
        ))}
      </dl>

      {/* Classes breakdown */}
      {classes.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nice Classification</p>
          <div className="space-y-2">
            {classes.map(c => (
              <div key={c.class_number} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-16 inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#f0f7f0] text-[#1a2e1a] text-xs font-bold font-mono border border-[#c8e0c8]">
                  Class {c.class_number}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{c.class_title_en}</p>
                  {c.goods_services_en && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.goods_services_en}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applicant */}
      {app.clients && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applicant</p>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {([
              ['Name', app.clients.legal_name],
              ['Type', app.clients.applicant_type === 'company' ? 'Company' : 'Individual'],
              ['Country', app.clients.country],
              ['City', app.clients.city],
              ['Email', app.clients.email],
              ['Phone', app.clients.phone],
            ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</dt>
                <dd className="text-gray-700 font-medium mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

// ─── Application Detail View ──────────────────────────────────────────────────

function ApplicationDetail({ appId, onBack }: { appId: string; onBack: () => void }) {
  const { user } = useAuth();
  const [app, setApp] = useState<AppDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'particulars' | 'timeline' | 'documents' | 'messages' | 'info'>('particulars');
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Payment panel state
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentInitializing, setPaymentInitializing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);

  const initPayment = async (appData: AppDetail) => {
    setPaymentInitializing(true);
    setPaymentError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          applicationId: appData.id,
          amountUsd: appData.total_amount_usd,
          markName: (Array.isArray(appData.trademarks) ? appData.trademarks[0] : appData.trademarks)?.mark_name ?? '',
          totalClasses: appData.total_classes,
          couponCode: couponApplied?.code ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
      setFinalAmount(data.finalAmountUsd ?? appData.total_amount_usd);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Could not initialize payment. Please try again.');
    } finally {
      setPaymentInitializing(false);
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true);
    setCouponError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}`, 'Apikey': supabaseAnonKey },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCouponError(data.error || 'Invalid coupon code.');
      } else {
        setCouponApplied({ code, discountPercent: data.discountPercent });
        setCouponInput('');
        setClientSecret(null);
      }
    } catch {
      setCouponError('Could not verify coupon. Please try again.');
    } finally {
      setCouponChecking(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [appRes, timelineRes, docsRes, msgsRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id, case_number, filing_status, payment_status, total_classes, total_amount_usd, service_fee_usd, government_fee_usd, created_at, impi_application_number, impi_filing_date, impi_publication_date, impi_registration_number, impi_registration_date, impi_renewal_deadline, priority_claimed, priority_country, clients(*), trademarks(*), trademark_classes(*)')
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

  const handlePrint = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Filing Particulars</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 13px; color: #111; padding: 32px; }
        dl { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: #e5e7eb; }
        .field { background: white; padding: 10px 14px; }
        dt { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 4px; }
        dd { font-size: 13px; font-weight: 600; color: #111; }
        .mono { font-family: monospace; color: #1a2e1a; }
        .section { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 700; margin-bottom: 12px; }
        .class-row { display: flex; gap: 12px; margin-bottom: 10px; }
        .class-badge { flex-shrink: 0; background: #f0f7f0; border: 1px solid #c8e0c8; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; font-family: monospace; }
        h1 { font-size: 20px; margin: 0 0 4px 0; }
        .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
        @media print { body { padding: 16px; } }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const trademark = Array.isArray(app?.trademarks) ? app!.trademarks[0] : app?.trademarks;
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
    { key: 'particulars', label: 'Filing Particulars', icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'documents', label: 'Documents', icon: Download },
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center overflow-hidden flex-shrink-0">
              {trademark?.logo_preview_url
                ? <img src={trademark.logo_preview_url} alt="" className="w-full h-full object-contain" />
                : <Shield size={22} className="text-[#2d5a2d]" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">{trademark?.mark_name ?? 'Trademark Application'}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm font-mono text-gray-500">{app.case_number}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.filing_status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[app.filing_status] ?? app.filing_status}
                </span>
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => app && exportSingleToCSV(app, `${app.case_number}.csv`)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
              title="Export to Excel/CSV"
            >
              <Sheet size={14} /> Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
              title="Print"
            >
              <Printer size={14} /> Print
            </button>
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

      {/* Payment required banner */}
      {app.payment_status === 'pending' && !paid && (
        <div className="mb-6">
          {!showPayment ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center flex-shrink-0">
                  <CreditCard size={18} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-900">Payment required to file this trademark</p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    Total due: <span className="font-bold">USD ${Number(app.total_amount_usd ?? 0).toFixed(2)}</span>
                    {app.total_classes > 0 && ` · ${app.total_classes} class${app.total_classes !== 1 ? 'es' : ''}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowPayment(true); if (app) initPayment(app); }}
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex-shrink-0"
              >
                <CreditCard size={15} /> Complete Payment
              </button>
            </div>
          ) : (
            <div className="bg-white border border-orange-200 rounded-xl overflow-hidden">
              <div className="bg-orange-50 border-b border-orange-200 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                    <CreditCard size={15} /> Complete Your Payment
                  </p>
                  <p className="text-xs text-orange-700 mt-0.5">{app.case_number} · {trademark?.mark_name}</p>
                </div>
                <button onClick={() => { setShowPayment(false); setClientSecret(null); setCouponApplied(null); }} className="text-orange-400 hover:text-orange-600 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Order Summary</p>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Service fee</span><span className="font-medium">USD ${Number(app.service_fee_usd ?? 0).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Government fee ({app.total_classes} class{app.total_classes !== 1 ? 'es' : ''})</span><span className="font-medium">USD ${Number(app.government_fee_usd ?? 0).toFixed(2)}</span></div>
                  {couponApplied && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Coupon ({couponApplied.code}) -{couponApplied.discountPercent}%</span>
                      <span className="font-medium">-USD ${(Number(app.total_amount_usd ?? 0) * couponApplied.discountPercent / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2">
                    <span>Total</span>
                    <span>USD ${(finalAmount ?? Number(app.total_amount_usd ?? 0)).toFixed(2)}</span>
                  </div>
                </div>
                {!clientSecret && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1"><Tag size={12} /> Coupon Code</p>
                    {couponApplied ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle2 size={14} className="text-green-600" />
                        <span className="text-sm text-green-700 font-medium flex-1">{couponApplied.code} — {couponApplied.discountPercent}% off</span>
                        <button onClick={() => { setCouponApplied(null); setFinalAmount(null); }} className="text-green-500 hover:text-green-700"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input value={couponInput} onChange={e => setCouponInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} placeholder="Enter code" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d] uppercase" />
                        <button onClick={handleApplyCoupon} disabled={couponChecking || !couponInput.trim()} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                          {couponChecking ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
                  </div>
                )}
                {!clientSecret ? (
                  <button onClick={() => app && initPayment(app)} disabled={paymentInitializing} className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
                    {paymentInitializing ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                    {paymentInitializing ? 'Preparing payment...' : 'Proceed to Card Payment'}
                  </button>
                ) : stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <DashboardCheckoutForm onSuccess={() => { setPaid(true); setShowPayment(false); load(); }} />
                  </Elements>
                ) : (
                  <p className="text-sm text-red-600">Stripe is not configured.</p>
                )}
                {paymentError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{paymentError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {paid && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-900">Payment received — thank you!</p>
            <p className="text-xs text-green-700 mt-0.5">Your application is now being processed by our team.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-shrink-0 justify-center px-3 py-2 rounded-md text-xs font-medium transition-all
              ${tab === t.key ? 'bg-white text-[#1a2e1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <t.icon size={13} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filing Particulars */}
      {tab === 'particulars' && (
        <FilingParticularsCard app={app} printRef={printRef} />
      )}

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
              <button onClick={() => downloadFile(doc.file_path, doc.file_name)} className="flex items-center gap-1.5 text-xs text-[#2d5a2d] hover:text-[#1a2e1a] font-medium transition-colors">
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
                  ${msg.sender_role === 'client' ? 'bg-[#1a2e1a] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
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
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="w-9 h-9 bg-[#1a2e1a] text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#2d5a2d] transition-colors">
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
              {([
                ['Owner Name', app.clients?.legal_name],
                ['Entity Type', app.clients?.applicant_type === 'company' ? 'Company' : 'Individual'],
                ['Country', app.clients?.country],
                ['City', app.clients?.city],
                ['Address', app.clients?.address],
                ['Postal Code', app.clients?.postal_code],
                ['Email', app.clients?.email],
                ['Phone', app.clients?.phone],
              ] as [string, string | undefined][]).map(([label, value]) => value ? (
                <div key={label}>
                  <dt className="text-gray-400 text-xs uppercase tracking-wide">{label}</dt>
                  <dd className="text-gray-800 font-medium mt-0.5">{value}</dd>
                </div>
              ) : null)}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Account Settings View ────────────────────────────────────────────────────

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
    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/dashboard` });
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
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d]" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d]" placeholder="Repeat new password" />
          </div>
          <button onClick={changePassword} disabled={saving} className="w-full bg-[#1a2e1a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5a2d] disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Update Password'}
          </button>
          <div className="pt-1 border-t border-gray-100 text-center">
            {resetSent ? (
              <p className="text-xs text-green-600 font-medium">Reset link sent to {user?.email}</p>
            ) : (
              <button type="button" onClick={sendResetEmail} disabled={resetLoading} className="text-xs text-gray-400 hover:text-[#2d5a2d] transition-colors disabled:opacity-50">
                {resetLoading ? 'Sending…' : 'Or send a reset link to my email'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

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

  useEffect(() => {
    if (profile?.password_change_required) setView('settings');
  }, [profile]);

  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [appsRes, draftRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id, case_number, filing_status, payment_status, total_classes, created_at, impi_application_number, impi_filing_date, impi_publication_date, impi_registration_number, impi_registration_date, impi_renewal_deadline, trademarks(mark_name, logo_preview_url), trademark_classes(class_number, class_title_en)')
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
      const clsArr = a.trademark_classes as Record<string, unknown>[] | null;
      const classTitles = clsArr?.map(c => `Class ${c.class_number}`).join(', ') ?? '';
      return {
        id: String(a.id),
        case_number: String(a.case_number),
        filing_status: String(a.filing_status),
        payment_status: String(a.payment_status),
        total_classes: Number(a.total_classes),
        created_at: String(a.created_at),
        trademark_name: tm ? String(tm.mark_name ?? '') : undefined,
        logo_preview_url: tm ? (tm.logo_preview_url ? String(tm.logo_preview_url) : undefined) : undefined,
        impi_application_number: a.impi_application_number as string | null,
        impi_filing_date: a.impi_filing_date as string | null,
        impi_publication_date: a.impi_publication_date as string | null,
        impi_registration_number: a.impi_registration_number as string | null,
        impi_registration_date: a.impi_registration_date as string | null,
        impi_renewal_deadline: a.impi_renewal_deadline as string | null,
        class_titles: classTitles,
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

  const handleListPrint = () => {
    const rows = applications.map(a => `
      <tr>
        <td>${a.trademark_name ?? '—'}</td>
        <td style="font-family:monospace">${a.case_number}</td>
        <td>${a.total_classes}</td>
        <td>${STATUS_LABELS[a.filing_status] ?? a.filing_status}</td>
        <td>${fmtShort(a.created_at)}</td>
        <td style="font-family:monospace">${a.impi_application_number ?? '—'}</td>
        <td>${fmtShort(a.impi_filing_date)}</td>
        <td>${fmtShort(a.impi_publication_date)}</td>
        <td style="font-family:monospace">${a.impi_registration_number ?? '—'}</td>
        <td>${fmtShort(a.impi_registration_date)}</td>
        <td>${fmtShort(a.impi_renewal_deadline)}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Trademark Docket</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 11px; padding: 24px; }
        h1 { font-size: 16px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1a2e1a; color: white; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
        @media print { body { padding: 12px; } }
      </style></head><body>
      <h1>Trademark Docket — ${new Date().toLocaleDateString()}</h1>
      <table>
        <thead><tr>
          <th>Mark</th><th>Case No.</th><th>Classes</th><th>Status</th>
          <th>Filed</th><th>IMPI App. No.</th><th>IMPI Filing</th>
          <th>Publication</th><th>IMPI Reg. No.</th><th>Registration</th><th>Renewal</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
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
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0f1f0f] text-white flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2d5a2d] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initials}</div>
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
          <Link to="/apply" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors mt-1">
            <Plus size={16} /> New Filing
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-rose-400 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
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
          {/* Applications list */}
          {view === 'applications' && (
            <>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
                  <p className="text-sm text-gray-500 mt-0.5">Track your trademark filings in real time</p>
                </div>
                <div className="flex items-center gap-2">
                  {applications.length > 0 && (
                    <>
                      <button
                        onClick={() => exportToCSV(applications, 'trademark-docket.csv')}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                        title="Export all to Excel/CSV"
                      >
                        <Sheet size={14} /> Export All
                      </button>
                      <button
                        onClick={handleListPrint}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                        title="Print docket"
                      >
                        <Printer size={14} /> Print Docket
                      </button>
                    </>
                  )}
                  <Link
                    to="/apply"
                    className="inline-flex items-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={15} /> New Filing
                  </Link>
                </div>
              </div>

              {/* Draft banner */}
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
                    <Link to="/apply?resume=1" className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
                      Continue <ChevronRight size={13} />
                    </Link>
                    <Link to="/apply?fresh=1" className="inline-flex items-center gap-1.5 border border-amber-300 text-amber-700 hover:bg-amber-100 text-xs font-medium px-3 py-2 rounded-lg transition-colors">
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
                  <Link to="/apply" className="inline-flex items-center gap-2 bg-[#1a2e1a] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-[#2d5a2d] transition-colors">
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

          {/* Detail view */}
          {view === 'detail' && selectedAppId && (
            <ApplicationDetail
              appId={selectedAppId}
              onBack={() => { setView('applications'); setSelectedAppId(null); }}
            />
          )}

          {/* Settings */}
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
