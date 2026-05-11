import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, FileText, Clock, CheckCircle2, AlertCircle, LogOut,
  ChevronRight, Download, MessageSquare, User, Settings,
  Bell, ArrowLeft, Send, Lock, Building2,
  Inbox, Shield, Pencil, CreditCard, Loader2, Tag, X,
  Printer, Sheet, Trash2, Receipt, ChevronDown, ChevronUp, RefreshCw, Eye, FileSearch,
  Globe, Phone
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import { useLanguage, type Language } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { COUNTRIES } from '../lib/countries';

// ─── Stripe singleton ─────────────────────────────────────────────────────────
const stripePromise = (() => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return key ? loadStripe(key) : null;
})();

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocketRow {
  // application fields
  app_id: string;
  case_number: string;
  payment_status: string;
  filing_status: string;
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
  // trademark fields
  trademark_name: string;
  mark_type: string;
  logo_preview_url: string | null;
  // applicant country
  country: string | null;
  // per-class fields (null when no classes yet)
  class_id: string | null;
  class_number: number | null;
  class_title_en: string | null;
  application_status: string | null;
  admin_comments: string | null;
  // payment receipt
  receipt_url: string | null;
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
  receipt_url?: string | null;
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
    application_status: string | null;
    admin_comments: string | null;
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

// ─── Status configs ───────────────────────────────────────────────────────────

const FILING_STAGES = [
  {
    key: 'received',
    label: 'Received',
    statuses: ['new', 'pending_review', 'pending_payment'],
    desc: 'Your application has been received and payment confirmed. Our team is preparing your file for review and professional classification.',
  },
  {
    key: 'review',
    label: 'Under Review',
    statuses: ['classification_pending', 'info_requested', 'ready_to_file'],
    desc: 'Our attorneys are reviewing your application, confirming the Nice Classification of your goods and services, and drafting the Spanish-language specification required by IMPI.',
  },
  {
    key: 'filed',
    label: 'Filed',
    statuses: ['filed'],
    desc: 'Your trademark application has been formally submitted to IMPI (Instituto Mexicano de la Propiedad Industrial). IMPI will assign an official application number and begin their substantive examination, which typically takes 3–6 months.',
  },
  {
    key: 'published',
    label: 'Published',
    statuses: ['published', 'office_action_pending'],
    desc: 'IMPI has approved your application and published it in the Official Gazette (Diario Oficial de la Federación) for a 30-day opposition period, during which third parties may file an opposition. If no opposition is filed, registration proceeds.',
  },
  {
    key: 'registered',
    label: 'Registered',
    statuses: ['registered'],
    desc: 'Congratulations — your trademark is officially registered in Mexico! Your registration certificate will be issued by IMPI and is valid for 10 years from the filing date, renewable indefinitely.',
  },
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

const APP_STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  in_review: 'In Review',
  filed: 'Filed',
  published: 'Published',
  granted: 'Granted',
  abandoned: 'Abandoned',
};
const APP_STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-orange-100 text-orange-700',
  in_review: 'bg-amber-100 text-amber-700',
  filed: 'bg-blue-100 text-blue-700',
  published: 'bg-cyan-100 text-cyan-700',
  granted: 'bg-emerald-100 text-emerald-700',
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

function exportDocketCSV(rows: DocketRow[], filename: string) {
  const headers = [
    'Mark Name', 'Case No.', 'Class', 'Filing Status', 'Application Status',
    'Date Filed', 'IMPI App. No.', 'IMPI Filing Date', 'Publication Date',
    'IMPI Reg. No.', 'Registration Date', 'Renewal / Expiration', 'Comments',
  ];
  const lines = rows.map(r => [
    r.trademark_name,
    r.case_number,
    r.class_number ? `Class ${r.class_number} — ${r.class_title_en ?? ''}` : '—',
    STATUS_LABELS[r.filing_status] ?? r.filing_status,
    r.application_status ? (APP_STATUS_LABELS[r.application_status] ?? r.application_status) : '—',
    fmtShort(r.created_at),
    r.impi_application_number ?? '',
    fmtShort(r.impi_filing_date),
    fmtShort(r.impi_publication_date),
    r.impi_registration_number ?? '',
    fmtShort(r.impi_registration_date),
    fmtShort(r.impi_renewal_deadline),
    r.admin_comments ?? '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printDocket(rows: DocketRow[]) {
  const trs = rows.map(r => `<tr>
    <td>${r.trademark_name}</td>
    <td style="font-family:monospace">${r.case_number}</td>
    <td>${r.class_number ? `Class ${r.class_number}` : '—'}</td>
    <td>${STATUS_LABELS[r.filing_status] ?? r.filing_status}</td>
    <td>${r.application_status ? (APP_STATUS_LABELS[r.application_status] ?? r.application_status) : '—'}</td>
    <td>${fmtShort(r.created_at)}</td>
    <td style="font-family:monospace">${r.impi_application_number ?? '—'}</td>
    <td>${fmtShort(r.impi_publication_date)}</td>
    <td style="font-family:monospace">${r.impi_registration_number ?? '—'}</td>
    <td>${fmtShort(r.impi_registration_date)}</td>
    <td>${fmtShort(r.impi_renewal_deadline)}</td>
    <td style="max-width:160px;word-break:break-word">${r.admin_comments ?? '—'}</td>
  </tr>`).join('');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Trademark Docket</title>
    <style>
      body{font-family:system-ui,sans-serif;font-size:10px;padding:20px}
      h1{font-size:15px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th{background:#1a2e1a;color:#fff;text-align:left;padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:.05em}
      td{padding:6px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}
      tr:nth-child(even) td{background:#f9fafb}
      @media print{body{padding:10px}}
    </style></head><body>
    <h1>Trademark Docket — ${new Date().toLocaleDateString()}</h1>
    <table><thead><tr>
      <th>Mark</th><th>Case No.</th><th>Class</th><th>Status</th><th>App. Status</th>
      <th>Filed</th><th>IMPI App.</th><th>Publication</th><th>IMPI Reg.</th>
      <th>Registration</th><th>Renewal</th><th>Comments</th>
    </tr></thead><tbody>${trs}</tbody></table></body></html>`);
  win.document.close(); win.focus();
  setTimeout(() => { win.print(); win.close(); }, 300);
}

// ─── Stage progress bar ───────────────────────────────────────────────────────

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

function DashboardCheckoutForm({
  onSuccess,
  applicationId,
  paymentIntentId,
}: {
  onSuccess: () => void;
  applicationId: string;
  paymentIntentId: string;
}) {
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
      return;
    }
    // Immediately sync status and trigger emails — don't rely solely on webhook
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/functions/v1/confirm-payment-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ paymentIntentId, applicationId }),
      });
    } catch (e) {
      console.error('confirm-payment-client failed:', e);
    }
    onSuccess();
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

// ─── Inline payment panel (used in docket row) ───────────────────────────────

function PaymentPanel({
  row,
  onClose,
  onPaid,
}: {
  row: DocketRow;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountPercent: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);

  const initPayment = async () => {
    setInitializing(true);
    setInitError(null);
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
          applicationId: row.app_id,
          amountUsd: row.total_amount_usd,
          markName: row.trademark_name,
          totalClasses: 1,
          couponCode: couponApplied?.code ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) throw new Error(data.error || 'Failed to initialize payment');
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId ?? '');
      setFinalAmount(data.finalAmountUsd ?? row.total_amount_usd);
    } catch (err) {
      setInitError(err instanceof Error ? err.message : 'Could not initialize payment.');
    } finally {
      setInitializing(false);
    }
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponChecking(true); setCouponError(null);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}`, 'Apikey': supabaseAnonKey },
        body: JSON.stringify({ couponCode: code }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setCouponError(data.error || 'Invalid coupon.'); }
      else { setCouponApplied({ code, discountPercent: data.discountPercent }); setCouponInput(''); setClientSecret(null); }
    } catch { setCouponError('Could not verify coupon.'); }
    finally { setCouponChecking(false); }
  };

  const totalDue = Number(row.total_amount_usd ?? 0);
  const discountAmt = couponApplied ? totalDue * couponApplied.discountPercent / 100 : 0;
  const showFinal = finalAmount ?? (totalDue - discountAmt);

  return (
    <div className="bg-white border border-orange-200 rounded-xl overflow-hidden mt-1">
      <div className="bg-orange-50 border-b border-orange-200 px-5 py-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-orange-900 flex items-center gap-2">
          <CreditCard size={14} /> Complete Payment — {row.case_number}
        </p>
        <button onClick={onClose} className="text-orange-400 hover:text-orange-600"><X size={16} /></button>
      </div>
      <div className="p-5 space-y-4">
        {/* Summary */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Summary</p>
          <div className="flex justify-between"><span className="text-gray-600">Service fee</span><span className="font-medium">USD ${Number(row.service_fee_usd ?? 0).toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Government fee</span><span className="font-medium">USD ${Number(row.government_fee_usd ?? 0).toFixed(2)}</span></div>
          {couponApplied && (
            <div className="flex justify-between text-green-700">
              <span>Coupon ({couponApplied.code}) -{couponApplied.discountPercent}%</span>
              <span className="font-medium">-USD ${discountAmt.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
            <span>Total</span><span>USD ${showFinal.toFixed(2)}</span>
          </div>
        </div>

        {/* Coupon */}
        {!clientSecret && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1"><Tag size={12} /> Coupon Code</p>
            {couponApplied ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm">
                <CheckCircle2 size={13} className="text-green-600" />
                <span className="text-green-700 font-medium flex-1">{couponApplied.code} — {couponApplied.discountPercent}% off</span>
                <button onClick={() => { setCouponApplied(null); setFinalAmount(null); }}><X size={13} className="text-green-500" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={couponInput} onChange={e => setCouponInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyCoupon()} placeholder="Enter code" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d] uppercase" />
                <button onClick={applyCoupon} disabled={couponChecking || !couponInput.trim()} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50">
                  {couponChecking ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}
          </div>
        )}

        {/* Stripe form or proceed button */}
        {!clientSecret ? (
          <button onClick={initPayment} disabled={initializing} className="w-full flex items-center justify-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-60">
            {initializing ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
            {initializing ? 'Preparing...' : 'Proceed to Card Payment'}
          </button>
        ) : stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <DashboardCheckoutForm
              applicationId={row.app_id}
              paymentIntentId={paymentIntentId}
              onSuccess={() => { onPaid(); onClose(); }}
            />
          </Elements>
        ) : (
          <p className="text-sm text-red-600">Stripe is not configured.</p>
        )}
        {initError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{initError}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

function DeleteConfirmDialog({
  caseNumber,
  onConfirm,
  onCancel,
  deleting,
  deleteError,
}: {
  caseNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
  deleteError?: string | null;
}) {
  return (
    <div className="mt-1 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-3">
      {deleteError && (
        <div className="flex items-center gap-2 bg-red-100 border border-red-300 rounded-lg px-3 py-2 text-xs text-red-800">
          <AlertCircle size={13} className="flex-shrink-0" /> {deleteError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">Delete case {caseNumber}?</p>
          <p className="text-xs text-red-700 mt-0.5">This will permanently remove the application and all associated data. This cannot be undone.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-700 rounded-lg hover:bg-red-100">Cancel</button>
          <button onClick={onConfirm} disabled={deleting} className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-1.5">
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Docket table ─────────────────────────────────────────────────────────────

function DocketTable({
  rows,
  onRefresh,
  onViewDetail,
}: {
  rows: DocketRow[];
  onRefresh: () => void;
  onViewDetail: (appId: string) => void;
}) {
  const [paymentRow, setPaymentRow] = useState<string | null>(null); // app_id of row with open payment panel
  const [deleteRow, setDeleteRow] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleComment = (key: string) =>
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleDelete = async (appId: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      // Delete child records first, then the application
      const steps = [
        supabase.from('filing_drafts').delete().eq('application_id', appId),
        supabase.from('trademark_classes').delete().eq('application_id', appId),
        supabase.from('trademarks').delete().eq('application_id', appId),
        supabase.from('goods_services').delete().eq('application_id', appId),
        supabase.from('payments').delete().eq('application_id', appId),
        supabase.from('timeline_events').delete().eq('application_id', appId),
        supabase.from('client_messages').delete().eq('application_id', appId),
        supabase.from('uploaded_files').delete().eq('application_id', appId),
      ];
      for (const step of steps) { await step; }
      const { error } = await supabase.from('applications').delete().eq('id', appId);
      if (error) throw new Error(error.message);
      setDeleteRow(null);
      setTimeout(() => onRefresh(), 300);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (rows.length === 0) {
    return (
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
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Desktop table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="bg-[#1a2e1a] text-white">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide w-8"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Mark</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Case No.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Country</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Class</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">App. Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide">Comments</th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide">Receipt</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => {
              const rowKey = row.class_id ?? row.app_id;
              const isPending = row.payment_status !== 'paid';
              const isPaid = row.payment_status === 'paid';
              const isPaymentOpen = paymentRow === row.app_id;
              const isDeleteOpen = deleteRow === row.app_id;
              const commentKey = `${row.app_id}-${row.class_id}`;
              const isExpanded = expandedComments.has(commentKey);
              const appStatus = row.application_status ?? 'pending_payment';

              return (
                <>
                  <tr
                    key={rowKey}
                    className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} hover:bg-[#f0f7f0]`}
                  >
                    {/* Logo */}
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-md bg-[#f0f7f0] border border-[#c8e0c8] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {row.logo_preview_url
                          ? <img src={row.logo_preview_url} alt="" className="w-full h-full object-contain" />
                          : <Shield size={13} className="text-[#2d5a2d]" />}
                      </div>
                    </td>

                    {/* Mark name */}
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">{row.trademark_name || 'Untitled'}</p>
                    </td>

                    {/* Case number */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-600">{row.case_number}</span>
                    </td>

                    {/* Country */}
                    <td className="px-4 py-3">
                      {row.country
                        ? <span className="text-xs text-gray-700">{row.country}</span>
                        : <span className="text-xs text-gray-300 italic">—</span>}
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3">
                      {row.class_number ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1a2e1a] bg-[#f0f7f0] border border-[#c8e0c8] px-2 py-0.5 rounded font-mono">
                          Cl. {row.class_number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Filing status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.filing_status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[row.filing_status] ?? row.filing_status}
                      </span>
                    </td>

                    {/* Application status (admin-set) */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[appStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {APP_STATUS_LABELS[appStatus] ?? appStatus}
                      </span>
                    </td>

                    {/* Comments (admin-set) */}
                    <td className="px-4 py-3 max-w-[180px]">
                      {row.admin_comments ? (
                        <div>
                          <p className={`text-xs text-gray-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                            {row.admin_comments}
                          </p>
                          {row.admin_comments.length > 80 && (
                            <button onClick={() => toggleComment(commentKey)} className="text-[10px] text-[#2d5a2d] font-medium mt-0.5 flex items-center gap-0.5">
                              {isExpanded ? <><ChevronUp size={10} /> Less</> : <><ChevronDown size={10} /> More</>}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">—</span>
                      )}
                    </td>

                    {/* Receipt */}
                    <td className="px-4 py-3 text-center">
                      {isPaid ? (
                        <button
                          onClick={() => onViewDetail(row.app_id)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#f0f7f0] border border-[#c8e0c8] text-[#2d5a2d] hover:bg-[#2d5a2d] hover:text-white transition-colors"
                          title="View & download receipt"
                        >
                          <Receipt size={13} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => setPaymentRow(isPaymentOpen ? null : row.app_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <CreditCard size={11} /> Pay
                            </button>
                            <button
                              onClick={() => onViewDetail(row.app_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-[#f0f7f0] hover:border-[#c8e0c8] text-xs font-medium rounded-lg transition-colors"
                              title="Review case details"
                            >
                              <Eye size={11} /> Review
                            </button>
                            <Link
                              to={`/apply?edit=${row.app_id}`}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                              title="Edit case"
                            >
                              <Pencil size={12} />
                            </Link>
                            {row.filing_status === 'pending_payment' && (
                              <button
                                onClick={() => { setDeleteRow(isDeleteOpen ? null : row.app_id); setDeleteError(null); }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
                                title="Delete case"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onViewDetail(row.app_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-[#f0f7f0] hover:border-[#c8e0c8] text-xs font-medium rounded-lg transition-colors"
                          >
                            View <ChevronRight size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Payment panel row */}
                  {isPaymentOpen && (
                    <tr key={`pay-${rowKey}`}>
                      <td colSpan={9} className="px-4 pb-3">
                        <PaymentPanel
                          row={row}
                          onClose={() => setPaymentRow(null)}
                          onPaid={() => { setPaymentRow(null); onRefresh(); }}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Delete confirm row */}
                  {isDeleteOpen && (
                    <tr key={`del-${rowKey}`}>
                      <td colSpan={9} className="px-4 pb-3">
                        <DeleteConfirmDialog
                          caseNumber={row.case_number}
                          onConfirm={() => handleDelete(row.app_id)}
                          onCancel={() => { setDeleteRow(null); setDeleteError(null); }}
                          deleting={deleting}
                          deleteError={deleteError}
                        />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Filing Particulars card ──────────────────────────────────────────────────

function FilingParticularsCard({ app, printRef, onDownloadReceipt }: { app: AppDetail; printRef: React.RefObject<HTMLDivElement | null>; onDownloadReceipt?: () => void }) {
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
        {onDownloadReceipt && (
          <button
            onClick={onDownloadReceipt}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-[#2d5a2d] border border-[#c8e0c8] bg-[#f0f7f0] hover:bg-[#2d5a2d] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            title="Download PDF receipt"
          >
            <Receipt size={13} /> Receipt
          </button>
        )}
      </div>

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

      {classes.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nice Classification</p>
          <div className="space-y-3">
            {classes.map(c => (
              <div key={c.class_number} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-16 inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#f0f7f0] text-[#1a2e1a] text-xs font-bold font-mono border border-[#c8e0c8]">
                  Class {c.class_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{c.class_title_en}</p>
                  {c.goods_services_en && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{c.goods_services_en}</p>}
                  {/* Admin-set per-class status/comments */}
                  {(c.application_status || c.admin_comments) && (
                    <div className="mt-2 flex flex-wrap gap-2 items-start">
                      {c.application_status && c.application_status !== 'pending_payment' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APP_STATUS_COLORS[c.application_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {APP_STATUS_LABELS[c.application_status] ?? c.application_status}
                        </span>
                      )}
                      {c.admin_comments && (
                        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-relaxed">{c.admin_comments}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  const [paymentInfo, setPaymentInfo] = useState<{ amount_usd: number; paid_at: string; stripe_payment_intent_id: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [appRes, timelineRes, docsRes, msgsRes, paymentRes] = await Promise.all([
      supabase
        .from('applications')
        .select('id, case_number, filing_status, payment_status, total_classes, total_amount_usd, service_fee_usd, government_fee_usd, created_at, impi_application_number, impi_filing_date, impi_publication_date, impi_registration_number, impi_registration_date, impi_renewal_deadline, priority_claimed, priority_country, clients(*), trademarks(*), trademark_classes(*)')
        .eq('id', appId)
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase.from('timeline_events').select('id, event_type, title, description, created_at').eq('application_id', appId).eq('is_visible_to_client', true).order('created_at', { ascending: false }),
      supabase.from('uploaded_files').select('id, file_name, category, file_path, file_size_bytes, created_at').eq('application_id', appId).eq('visible_to_client', true).order('created_at', { ascending: false }),
      supabase.from('client_messages').select('id, sender_role, content, is_read, created_at').eq('application_id', appId).order('created_at', { ascending: true }),
      supabase.from('payments').select('receipt_url, amount_usd, paid_at, stripe_payment_intent_id').eq('application_id', appId).eq('status', 'paid').maybeSingle(),
    ]);
    const pd = paymentRes.data;
    const receiptUrl = pd?.receipt_url && pd.receipt_url.length > 0 ? pd.receipt_url : null;
    if (pd?.amount_usd && pd?.paid_at) {
      setPaymentInfo({ amount_usd: Number(pd.amount_usd), paid_at: pd.paid_at, stripe_payment_intent_id: pd.stripe_payment_intent_id ?? '' });
    }
    const appData = appRes.data ? { ...(appRes.data as AppDetail), receipt_url: receiptUrl } : null;
    setApp(appData);
    setTimeline(timelineRes.data ?? []);
    setDocuments(docsRes.data ?? []);
    setMessages(msgsRes.data ?? []);
    setLoading(false);
  }, [appId, user]);

  useEffect(() => { load(); }, [load]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from('client_messages').insert({ application_id: appId, sender_id: user.id, sender_role: 'client', content: newMessage.trim() });
    setNewMessage('');
    await load();
    setSending(false);
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('trademark-assets').createSignedUrl(filePath, 3600);
    if (data?.signedUrl) {
      const a = document.createElement('a'); a.href = data.signedUrl; a.download = fileName; a.click();
    }
  };

  const exportCSV = () => {
    if (!app) return;
    const trademark = Array.isArray(app.trademarks) ? app.trademarks[0] : app.trademarks;
    const classes = (app.trademark_classes ?? []).map(c => `Class ${c.class_number} – ${c.class_title_en}`).join('; ');
    const rows = [
      ['Field', 'Value'],
      ['Mark Name', trademark?.mark_name ?? ''],
      ['Internal Case No.', app.case_number],
      ['Filing Status', STATUS_LABELS[app.filing_status] ?? app.filing_status],
      ['Classes', classes],
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
    const a = document.createElement('a'); a.href = url; a.download = `${app.case_number}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const html = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Filing Particulars</title>
      <style>
        body{font-family:system-ui,sans-serif;font-size:13px;color:#111;padding:32px}
        dl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:#e5e7eb}
        .field{background:white;padding:10px 14px}
        dt{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;margin-bottom:4px}
        dd{font-size:13px;font-weight:600;color:#111}
        .mono{font-family:monospace;color:#1a2e1a}
        .section{margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px}
        .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;font-weight:700;margin-bottom:12px}
        @media print{body{padding:16px}}
      </style></head><body>${html}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  const handleDownloadReceipt = () => {
    if (!app || !paymentInfo) return;
    const tm = Array.isArray(app.trademarks) ? app.trademarks[0] : app.trademarks;
    const classes = (app.trademark_classes ?? []).map(c => `Class ${c.class_number} — ${c.class_title_en}`).join(', ') || '—';
    const countryName = app.clients?.country
      ? (COUNTRIES.find(c => c.code === app.clients!.country)?.en ?? app.clients.country)
      : '—';
    const piShort = paymentInfo.stripe_payment_intent_id
      ? paymentInfo.stripe_payment_intent_id.replace('pi_', '').slice(-12).toUpperCase()
      : '—';
    const paidDate = paymentInfo.paid_at ? new Date(paymentInfo.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const amount = `USD $${Number(paymentInfo.amount_usd).toFixed(2)}`;

    const logoUrl = `${window.location.origin}/logo.svg`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt — ${app.case_number}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#111;background:#fff;padding:0}
  .page{max-width:680px;margin:0 auto;padding:48px 40px}
  .header{background:#1a2e1a;color:#fff;border-radius:10px 10px 0 0;padding:24px 32px;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .header-left{display:flex;align-items:center;gap:16px}
  .logo-wrap{background:#fff;border-radius:8px;padding:6px 10px;display:flex;align-items:center;justify-content:center}
  .logo-wrap img{height:38px;width:auto;object-fit:contain;display:block}
  .brand{font-size:18px;font-weight:800;letter-spacing:-0.3px;color:#fff;line-height:1.2}
  .brand-sub{font-size:10px;color:#a3c4a3;margin-top:3px;letter-spacing:.04em}
  .stamp{background:#22c55e;color:#fff;font-size:13px;font-weight:800;padding:6px 18px;border-radius:20px;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0}
  .receipt-title{margin:28px 0 6px;font-size:20px;font-weight:700;color:#1a2e1a}
  .receipt-sub{font-size:12px;color:#6b7280}
  .ref{font-size:11px;color:#9ca3af;margin-top:4px;font-family:monospace}
  .divider{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;font-weight:700;margin-bottom:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:20px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 24px;margin-bottom:20px}
  dt{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#9ca3af;font-weight:600;margin-bottom:3px}
  dd{font-size:13px;font-weight:600;color:#111;word-break:break-word}
  dd.mono{font-family:monospace;color:#1a2e1a;font-size:12px}
  .amount-table{width:100%;border-collapse:collapse;margin:12px 0}
  .amount-table td{padding:8px 0;font-size:13px;border-bottom:1px solid #f3f4f6}
  .amount-table td:last-child{text-align:right;font-weight:600}
  .amount-table tr.total td{border-bottom:none;border-top:2px solid #1a2e1a;padding-top:12px;font-size:15px;font-weight:800;color:#1a2e1a}
  .footer{margin-top:36px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;line-height:1.6;text-align:center}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:32px 28px}}
</style>
</head><body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo-wrap"><img src="${logoUrl}" alt="Mexico Trademark Center" /></div>
      <div>
        <div class="brand">Lawtaem LLC</div>
        <div class="brand-sub">2 S Biscayne Blvd, Suite 3200-2833 &middot; Miami, FL 33131, USA</div>
      </div>
    </div>
    <div class="stamp">PAID</div>
  </div>

  <div class="receipt-title">Official Payment Receipt</div>
  <div class="receipt-sub">This document serves as proof of payment for trademark filing services rendered through Mexico Trademark Center.</div>
  <div class="ref">Reference: ${piShort} &nbsp;·&nbsp; Issued: ${paidDate}</div>

  <hr class="divider" />

  <div class="section-title">Applicant Information</div>
  <div class="grid">
    <div><dt>Name / Entity</dt><dd>${app.clients?.legal_name ?? '—'}</dd></div>
    <div><dt>Country</dt><dd>${countryName}</dd></div>
    <div><dt>Email</dt><dd>${app.clients?.email ?? '—'}</dd></div>
    <div><dt>Phone</dt><dd>${app.clients?.phone ?? '—'}</dd></div>
  </div>

  <hr class="divider" />

  <div class="section-title">Filing Details</div>
  <div class="grid3">
    <div><dt>Case Number</dt><dd class="mono">${app.case_number}</dd></div>
    <div><dt>Mark Name</dt><dd>${tm?.mark_name ?? '—'}</dd></div>
    <div><dt>Mark Type</dt><dd>${tm?.mark_type ? tm.mark_type.charAt(0).toUpperCase() + tm.mark_type.slice(1) : '—'}</dd></div>
    <div style="grid-column:span 3"><dt>Nice Classification</dt><dd>${classes}</dd></div>
  </div>

  <hr class="divider" />

  <div class="section-title">Payment Summary</div>
  <table class="amount-table">
    <tr><td>Service Fee</td><td>USD $${Number(app.service_fee_usd ?? 0).toFixed(2)}</td></tr>
    <tr><td>Government Filing Fee (IMPI)</td><td>USD $${Number(app.government_fee_usd ?? 0).toFixed(2)}</td></tr>
    <tr class="total"><td>Total Paid</td><td>${amount}</td></tr>
  </table>

  <div class="footer">
    Lawtaem LLC &mdash; Mexico Trademark Center<br>
    2 S Biscayne Boulevard, Suite 3200-2833, Miami, Florida 33131, USA<br>
    Payment processed on ${paidDate} &middot; Transaction ref: ${paymentInfo.stripe_payment_intent_id}<br>
    This receipt confirms that full payment has been received and your application is being processed.
  </div>
</div>
<script>setTimeout(function(){window.print();},350);</script>
</body></html>`);
    win.document.close();
    win.focus();
  };

  const trademark = Array.isArray(app?.trademarks) ? app!.trademarks[0] : app?.trademarks;
  const currentStageIndex = app ? getStageIndex(app.filing_status) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#2d5a2d] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!app) return <div className="text-center py-24 text-gray-500">Application not found.</div>;

  const tabs = [
    { key: 'particulars', label: 'Filing Particulars', icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'documents', label: 'Documents', icon: Download },
    { key: 'messages', label: 'Messages', icon: MessageSquare },
    { key: 'info', label: 'My Info', icon: User },
  ] as const;

  return (
    <div>
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={15} /> Back to Docket
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
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            {app.payment_status === 'paid' && paymentInfo && (
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center gap-1.5 text-xs font-medium text-[#2d5a2d] border border-[#c8e0c8] bg-[#f0f7f0] hover:bg-[#2d5a2d] hover:text-white px-3 py-1.5 rounded-lg transition-colors"
                title="Download PDF receipt"
              >
                <Receipt size={14} /> Receipt
              </button>
            )}
            <button onClick={exportCSV} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors" title="Export to CSV">
              <Sheet size={14} /> Excel
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors" title="Print">
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        <div className="mt-5 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-4">Prosecution Progress</p>
          <StageProgress status={app.filing_status} />
          {FILING_STAGES[currentStageIndex] && (
            <div className="mt-4 bg-[#f0f7f0] border border-[#c8e0c8] rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-[#1a2e1a] mb-1">
                Current Stage: {FILING_STAGES[currentStageIndex].label}
              </p>
              <p className="text-xs text-[#2d5a2d] leading-relaxed">
                {FILING_STAGES[currentStageIndex].desc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 flex-shrink-0 justify-center px-3 py-2 rounded-md text-xs font-medium transition-all
              ${tab === t.key ? 'bg-white text-[#1a2e1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={13} /><span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'particulars' && <FilingParticularsCard app={app} printRef={printRef} onDownloadReceipt={paymentInfo ? handleDownloadReceipt : undefined} />}

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

      {tab === 'documents' && (
        <div className="space-y-2">
          {documents.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No documents available yet.</p>
            </div>
          ) : documents.map(doc => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f7f0] flex items-center justify-center flex-shrink-0">
                <FileText size={16} className="text-[#2d5a2d]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doc.category.replace(/_/g, ' ')} · {(doc.file_size_bytes / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => downloadFile(doc.file_path, doc.file_name)} className="flex items-center gap-1.5 text-xs text-[#2d5a2d] hover:text-[#1a2e1a] font-medium transition-colors">
                <Download size={14} /> Download
              </button>
            </div>
          ))}
        </div>
      )}

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
            <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} placeholder="Type a message to our team..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d] focus:border-transparent" />
            <button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="w-9 h-9 bg-[#1a2e1a] text-white rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#2d5a2d] transition-colors">
              <Send size={15} />
            </button>
          </div>
        </div>
      )}

      {tab === 'info' && (
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
      )}
    </div>
  );
}

// ─── Account Settings ─────────────────────────────────────────────────────────

function AccountSettings({ language }: { language: string }) {
  const { user, profile } = useAuth();

  // Profile editing
  const [editName, setEditName] = useState(profile?.full_name ?? '');
  const [editPhone, setEditPhone] = useState(profile?.phone ?? '');
  const [editWechat, setEditWechat] = useState(profile?.wechat ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email change
  const [editEmail, setEditEmail] = useState('');
  const [emailChanging, setEmailChanging] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const l = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string, ja?: string) =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : language === 'ja' ? (ja ?? en) : en;

  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name ?? '');
      setEditPhone(profile.phone ?? '');
      setEditWechat(profile.wechat ?? '');
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileMsg(null);
    const { error } = await supabase.from('profiles').update({
      full_name: editName,
      phone: editPhone,
      wechat: editWechat,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (error) {
      setProfileMsg({ type: 'error', text: error.message });
    } else {
      setProfileMsg({ type: 'success', text: l('Profile saved.', '个人资料已保存。', 'Perfil guardado.', 'Profil gespeichert.', 'Profil enregistré.', 'प्रोफ़ाइल सहेजा गया।', 'Perfil salvo.', 'プロフィールを保存しました。') });
    }
    setProfileSaving(false);
  };

  const changeEmail = async () => {
    if (!editEmail.trim()) return;
    setEmailChanging(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: editEmail.trim() });
    if (error) {
      setEmailMsg({ type: 'error', text: error.message });
    } else {
      setEmailMsg({ type: 'success', text: l('Verification link sent. Check your new inbox to confirm the change.', '验证链接已发送。请检查新邮箱以确认更改。', 'Enlace de verificación enviado. Revisa tu nueva bandeja para confirmar.', 'Bestätigungslink gesendet. Prüfen Sie Ihr neues Postfach.', 'Lien de vérification envoyé. Vérifiez votre nouvelle boîte mail.', 'सत्यापन लिंक भेजा गया। परिवर्तन की पुष्टि के लिए अपना नया इनबॉक्स जांचें।', 'Link de verificação enviado. Verifique sua nova caixa de entrada.', '確認リンクを送信しました。新しいメールボックスを確認してください。') });
      setEditEmail('');
    }
    setEmailChanging(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { setMsg({ type: 'error', text: l('Passwords do not match.', '密码不匹配。', 'Las contraseñas no coinciden.') }); return; }
    if (newPassword.length < 8) { setMsg({ type: 'error', text: l('Password must be at least 8 characters.', '密码至少需要8个字符。', 'La contraseña debe tener al menos 8 caracteres.') }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setMsg({ type: 'error', text: error.message }); }
    else {
      setMsg({ type: 'success', text: l('Password updated successfully.', '密码更新成功。', 'Contraseña actualizada correctamente.') });
      setNewPassword(''); setConfirmPassword('');
      if (profile) await supabase.from('profiles').update({ password_change_required: false }).eq('id', user!.id);
    }
    setSaving(false);
  };

  const sendResetEmail = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/dashboard` });
    setResetSent(true); setResetLoading(false);
  };

  const inputClass = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2d5a2d]';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wide mb-1 block';

  return (
    <div className="space-y-5 max-w-lg">
      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={15} className="text-[#2d5a2d]" />
          {l('Profile', '个人资料', 'Perfil', 'Profil', 'Profil', 'प्रोफ़ाइल', 'Perfil', 'プロフィール')}
        </h3>
        {profileMsg && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {profileMsg.text}
          </div>
        )}
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{l('Full Name', '全名', 'Nombre completo', 'Vollständiger Name', 'Nom complet', 'पूरा नाम', 'Nome completo', '氏名')}</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{l('Phone', '电话', 'Teléfono', 'Telefon', 'Téléphone', 'फ़ोन', 'Telefone', '電話')}</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className={`${inputClass} pl-8`} placeholder="+1 555 000 0000" />
            </div>
          </div>
          <div>
            <label className={labelClass}>WeChat</label>
            <input type="text" value={editWechat} onChange={e => setEditWechat(e.target.value)} className={inputClass} placeholder="WeChat ID" />
          </div>
          <button onClick={saveProfile} disabled={profileSaving} className="w-full bg-[#1a2e1a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5a2d] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {profileSaving ? <Loader2 size={14} className="animate-spin" /> : null}
            {profileSaving ? l('Saving…', '保存中…', 'Guardando…', 'Speichern…', 'Enregistrement…', 'सहेज रहे हैं…', 'Salvando…', '保存中…') : l('Save Profile', '保存个人资料', 'Guardar perfil', 'Profil speichern', 'Enregistrer le profil', 'प्रोफ़ाइल सहेजें', 'Salvar perfil', 'プロフィールを保存')}
          </button>
        </div>
      </div>

      {/* Email change card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Inbox size={15} className="text-[#2d5a2d]" />
          {l('Email Address', '电子邮件地址', 'Dirección de correo', 'E-Mail-Adresse', 'Adresse e-mail', 'ईमेल पता', 'Endereço de e-mail', 'メールアドレス')}
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          {l('Current:', '当前：', 'Actual:', 'Aktuell:', 'Actuel:', 'वर्तमान:', 'Atual:', '現在：')} <strong className="text-gray-600">{user?.email}</strong>
        </p>
        {emailMsg && (
          <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${emailMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {emailMsg.text}
          </div>
        )}
        <div className="space-y-2">
          <label className={labelClass}>{l('New Email Address', '新电子邮件', 'Nuevo correo electrónico', 'Neue E-Mail', 'Nouvel e-mail', 'नया ईमेल', 'Novo e-mail', '新しいメール')}</label>
          <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputClass} placeholder={l('new@email.com', 'new@email.com', 'nuevo@correo.com', 'neu@email.de', 'nouveau@email.fr', 'new@email.com', 'novo@email.com', 'new@email.com')} />
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {l('A verification link will be sent to the new address. The change takes effect after you click it.', '验证链接将发送至新地址。点击后更改生效。', 'Se enviará un enlace al nuevo correo. El cambio tendrá efecto tras hacer clic.', 'Ein Bestätigungslink wird an die neue Adresse gesendet.', 'Un lien de vérification sera envoyé à la nouvelle adresse.', 'नए पते पर सत्यापन लिंक भेजा जाएगा।', 'Um link de verificação será enviado ao novo endereço.', '新しいアドレスに確認リンクが送信されます。')}
          </p>
          <button onClick={changeEmail} disabled={emailChanging || !editEmail.trim()} className="w-full bg-[#1a2e1a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5a2d] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {emailChanging ? <Loader2 size={14} className="animate-spin" /> : null}
            {l('Send Verification Link', '发送验证链接', 'Enviar enlace de verificación', 'Bestätigungslink senden', 'Envoyer le lien', 'सत्यापन लिंक भेजें', 'Enviar link de verificação', '確認リンクを送信')}
          </button>
        </div>
      </div>

      {/* Password card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={15} className="text-[#2d5a2d]" />
          {l('Change Password', '更改密码', 'Cambiar contraseña', 'Passwort ändern', 'Changer le mot de passe', 'पासवर्ड बदलें', 'Alterar senha', 'パスワード変更')}
        </h3>
        {msg && <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg.text}</div>}
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{l('New Password', '新密码', 'Nueva contraseña', 'Neues Passwort', 'Nouveau mot de passe', 'नया पासवर्ड', 'Nova senha', '新しいパスワード')}</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder={l('Min. 8 characters', '至少8个字符', 'Mín. 8 caracteres')} />
          </div>
          <div>
            <label className={labelClass}>{l('Confirm Password', '确认密码', 'Confirmar contraseña', 'Passwort bestätigen', 'Confirmer le mot de passe', 'पासवर्ड की पुष्टि', 'Confirmar senha', 'パスワード確認')}</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder={l('Repeat new password', '重复新密码', 'Repite la nueva contraseña')} />
          </div>
          <button onClick={changePassword} disabled={saving} className="w-full bg-[#1a2e1a] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2d5a2d] disabled:opacity-50 transition-colors">
            {saving ? l('Saving…', '保存中…', 'Guardando…') : l('Update Password', '更新密码', 'Actualizar contraseña', 'Passwort aktualisieren', 'Mettre à jour le mot de passe', 'पासवर्ड अपडेट करें', 'Atualizar senha', 'パスワードを更新')}
          </button>
          <div className="pt-1 border-t border-gray-100 text-center">
            {resetSent
              ? <p className="text-xs text-green-600 font-medium">{l('Reset link sent to', 'リセットリンクを送信しました', 'Enlace enviado a')} {user?.email}</p>
              : <button type="button" onClick={sendResetEmail} disabled={resetLoading} className="text-xs text-gray-400 hover:text-[#2d5a2d] transition-colors disabled:opacity-50">{resetLoading ? l('Sending…', '发送中…', 'Enviando…') : l('Or send a reset link to my email', '或发送重置链接至我的邮箱', 'O enviar un enlace a mi correo')}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

interface ClearanceReport {
  id: string;
  mark_name: string;
  goods_services: string;
  language: string;
  final_amount_usd: number;
  paid_at: string;
  pdf_storage_path: string | null;
  email_sent_at: string | null;
}

type View = 'docket' | 'detail' | 'settings' | 'reports';

const LANG_OPTIONS: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
];

export default function DashboardPage() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const [docketRows, setDocketRows] = useState<DocketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>(params.id ? 'detail' : 'docket');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(params.id ?? null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [draft, setDraft] = useState<FilingDraft | null>(null);
  const [reports, setReports] = useState<ClearanceReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const tri = (en: string, zh: string, es: string, de?: string, fr?: string, hi?: string, pt?: string, ja?: string): string =>
    language === 'zh' ? zh : language === 'es' ? es : language === 'de' ? (de ?? en) : language === 'fr' ? (fr ?? en) : language === 'hi' ? (hi ?? en) : language === 'pt' ? (pt ?? en) : language === 'ja' ? (ja ?? en) : en;

  // Apply profile language preference on mount
  useEffect(() => {
    if (profile?.preferred_language && profile.preferred_language !== language) {
      setLanguage(profile.preferred_language as Language);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.preferred_language]);

  const handleSetLanguage = async (lang: Language) => {
    setLanguage(lang);
    setLangMenuOpen(false);
    if (user) {
      await supabase.from('profiles').update({ preferred_language: lang }).eq('id', user.id);
    }
  };

  useEffect(() => {
    if (profile?.password_change_required) setView('settings');
  }, [profile]);

  const loadDocket = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [appsRes, paymentsRes, draftRes] = await Promise.all([
      supabase
        .from('applications')
        .select(`
          id, case_number, filing_status, payment_status,
          total_amount_usd, service_fee_usd, government_fee_usd,
          created_at, impi_application_number, impi_filing_date,
          impi_publication_date, impi_registration_number,
          impi_registration_date, impi_renewal_deadline,
          clients(country),
          trademarks(mark_name, mark_type, logo_preview_url),
          trademark_classes(id, class_number, class_title_en, application_status, admin_comments)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('payments')
        .select('application_id, receipt_url, status')
        .eq('status', 'paid'),
      supabase
        .from('filing_drafts')
        .select('id, current_step, mark_name, logo_preview_data, updated_at')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    // Build receipt map
    const receiptMap: Record<string, string> = {};
    for (const p of (paymentsRes.data ?? [])) {
      if (p.receipt_url && p.receipt_url.length > 0) receiptMap[p.application_id] = p.receipt_url;
    }

    // Flatten to one row per class (or one row if no classes)
    const rows: DocketRow[] = [];
    for (const app of (appsRes.data ?? []) as Record<string, unknown>[]) {
      const tms = app.trademarks as Record<string, unknown>[] | Record<string, unknown> | null;
      const tm = Array.isArray(tms) ? tms[0] : tms;
      const classes = (app.trademark_classes as Record<string, unknown>[] | null) ?? [];

      const clientRaw = app.clients as Record<string, unknown> | null;
      const countryCode = clientRaw ? (clientRaw.country as string | null) : null;
      const countryName = countryCode
        ? (COUNTRIES.find(c => c.code === countryCode)?.en ?? countryCode)
        : null;

      const base: Omit<DocketRow, 'class_id' | 'class_number' | 'class_title_en' | 'application_status' | 'admin_comments'> = {
        app_id: String(app.id),
        case_number: String(app.case_number),
        payment_status: String(app.payment_status),
        filing_status: String(app.filing_status),
        total_amount_usd: app.total_amount_usd as number | null,
        service_fee_usd: app.service_fee_usd as number | null,
        government_fee_usd: app.government_fee_usd as number | null,
        created_at: String(app.created_at),
        impi_application_number: app.impi_application_number as string | null,
        impi_filing_date: app.impi_filing_date as string | null,
        impi_publication_date: app.impi_publication_date as string | null,
        impi_registration_number: app.impi_registration_number as string | null,
        impi_registration_date: app.impi_registration_date as string | null,
        impi_renewal_deadline: app.impi_renewal_deadline as string | null,
        trademark_name: tm ? String(tm.mark_name ?? '') : '',
        mark_type: tm ? String(tm.mark_type ?? '') : '',
        logo_preview_url: tm ? (tm.logo_preview_url as string | null) : null,
        country: countryName,
        receipt_url: receiptMap[String(app.id)] ?? null,
      };

      if (classes.length === 0) {
        rows.push({ ...base, class_id: null, class_number: null, class_title_en: null, application_status: null, admin_comments: null });
      } else {
        for (const c of classes) {
          rows.push({
            ...base,
            class_id: String(c.id),
            class_number: c.class_number as number,
            class_title_en: c.class_title_en as string | null,
            application_status: c.application_status as string | null,
            admin_comments: c.admin_comments as string | null,
          });
        }
      }
    }

    setDocketRows(rows);
    setDraft(draftRes.data as FilingDraft | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDocket(); }, [loadDocket]);

  const loadReports = useCallback(async () => {
    if (!user) return;
    setReportsLoading(true);
    const { data } = await supabase
      .from('clearance_report_orders')
      .select('id, mark_name, goods_services, language, final_amount_usd, paid_at, pdf_storage_path, email_sent_at')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false });
    setReports((data as ClearanceReport[]) ?? []);
    setReportsLoading(false);
  }, [user]);

  useEffect(() => { if (view === 'reports') loadReports(); }, [view, loadReports]);

  const handleDownloadReport = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-report-download-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ reportOrderId: reportId }),
      });
      const d = await res.json();
      if (d.url) window.open(d.url, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const stats = [
    { label: tri('Total Cases', '案件总数', 'Casos totales', 'Gesamt', 'Total', 'कुल मामले', 'Total', '総件数'), value: docketRows.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: tri('In Progress', '进行中', 'En proceso', 'Laufend', 'En cours', 'प्रगति में', 'Em andamento', '処理中'), value: docketRows.filter(r => ['new','pending_review','filed','ready_to_file'].includes(r.filing_status)).length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: tri('Registered', '已注册', 'Registradas', 'Eingetragen', 'Enregistrées', 'पंजीकृत', 'Registradas', '登録済み'), value: docketRows.filter(r => r.filing_status === 'registered').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: tri('Action Needed', '需要操作', 'Acción requerida', 'Aktion nötig', 'Action requise', 'कार्रवाई आवश्यक', 'Ação necessária', '対応必要'), value: docketRows.filter(r => ['info_requested','office_action_pending','pending_payment'].includes(r.filing_status)).length, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const navItems = [
    { key: 'docket', label: tri('My Docket', '我的案件', 'Mi Expediente', 'Mein Docket', 'Mon dossier', 'मेरी सूची', 'Meu Painel', '自分のドケット'), icon: FileText },
    { key: 'reports', label: tri('Search Reports', '搜索报告', 'Informes de búsqueda', 'Suchberichte', 'Rapports de recherche', 'खोज रिपोर्ट', 'Relatórios de busca', '検索レポート'), icon: FileSearch },
    { key: 'settings', label: tri('Account Settings', '账户设置', 'Configuración de cuenta', 'Kontoeinstellungen', 'Paramètres du compte', 'खाता सेटिंग', 'Configurações da conta', 'アカウント設定'), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {langMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />}

      {/* Sidebar — z-50 keeps it above the lang backdrop (z-40) so the language button stays clickable */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0f1f0f] text-white flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="px-6 py-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#c9a84c] rounded flex items-center justify-center"><Shield size={14} className="text-white" /></div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Mexico Trademark</p>
              <p className="text-[10px] text-green-400 mt-0.5">{tri('Client Portal', '客户门户', 'Portal del Cliente', 'Kundenportal', 'Portail client', 'क्लाइंट पोर्टल', 'Portal do Cliente', 'クライアントポータル')}</p>
            </div>
          </Link>
        </div>
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#2d5a2d] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? tri('Client', '客户', 'Cliente', 'Kunde', 'Client', 'क्लाइंट', 'Cliente', 'クライアント')}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          {profile?.password_change_required && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 bg-amber-900/30 rounded-lg px-2.5 py-1.5">
              <Bell size={11} /> {tri('Please set your password', '请设置您的密码', 'Por favor establece tu contraseña', 'Bitte Passwort setzen', 'Veuillez définir votre mot de passe', 'कृपया अपना पासवर्ड सेट करें', 'Por favor defina sua senha', 'パスワードを設定してください')}
            </div>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setView(item.key as View); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${view === item.key || (item.key === 'docket' && view === 'detail') ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={16} />{item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(v => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Globe size={16} />
              <span className="flex-1 text-left">{LANG_OPTIONS.find(l => l.code === language)?.label ?? 'Language'}</span>
              <ChevronRight size={12} className={`transition-transform ${langMenuOpen ? 'rotate-90' : ''}`} />
            </button>
            {langMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-[#1a2e1a] border border-white/10 rounded-xl overflow-hidden shadow-xl z-60">
                {LANG_OPTIONS.map(opt => (
                  <button
                    key={opt.code}
                    onClick={() => handleSetLanguage(opt.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${language === opt.code ? 'bg-white/15 text-white font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="text-base">{opt.flag}</span> {opt.label}
                    {language === opt.code && <CheckCircle2 size={12} className="ml-auto text-green-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-rose-400 transition-colors">
            <LogOut size={16} /> {tri('Sign Out', '退出登录', 'Cerrar sesión', 'Abmelden', 'Se déconnecter', 'साइन आउट', 'Sair', 'サインアウト')}
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
          <span className="text-sm font-semibold text-gray-800">{tri('Client Portal', '客户门户', 'Portal del Cliente', 'Kundenportal', 'Portail client', 'क्लाइंट पोर्टल', 'Portal do Cliente', 'クライアントポータル')}</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setLangMenuOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <Globe size={18} />
              </button>
              {langMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xl z-60">
                  {LANG_OPTIONS.map(opt => (
                    <button key={opt.code} onClick={() => handleSetLanguage(opt.code)} className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm ${language === opt.code ? 'bg-[#f0f7f0] text-[#1a2e1a] font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <span>{opt.flag}</span> {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-[#2d5a2d] flex items-center justify-center text-xs font-bold text-white">{initials}</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">

          {/* Docket view */}
          {view === 'docket' && (
            <>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{tri('My Docket', '我的案件', 'Mi Expediente', 'Mein Docket', 'Mon dossier', 'मेरी सूची', 'Meu Painel', '自分のドケット')}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{tri('All your trademark cases in one place', '您的所有商标案件', 'Todos tus casos de marca en un lugar', 'Alle Ihre Markenfälle an einem Ort', 'Tous vos dossiers de marque au même endroit', 'आपके सभी ट्रेडमार्क मामले एक जगह', 'Todos os seus casos de marca em um lugar', 'すべての商標案件を一か所で')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={loadDocket} disabled={loading} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50" title={tri('Refresh', '刷新', 'Actualizar', 'Aktualisieren', 'Actualiser', 'ताज़ा करें', 'Atualizar', '更新')}>
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {tri('Refresh', '刷新', 'Actualizar', 'Aktualisieren', 'Actualiser', 'ताज़ा करें', 'Atualizar', '更新')}
                  </button>
                  {docketRows.length > 0 && (
                    <>
                      <button onClick={() => exportDocketCSV(docketRows, 'trademark-docket.csv')} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                        <Sheet size={14} /> {tri('Export', '导出', 'Exportar', 'Exportieren', 'Exporter', 'निर्यात', 'Exportar', 'エクスポート')}
                      </button>
                      <button onClick={() => printDocket(docketRows)} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                        <Printer size={14} /> {tri('Print', '打印', 'Imprimir', 'Drucken', 'Imprimer', 'प्रिंट', 'Imprimir', '印刷')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Draft banner */}
              {draft && (
                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {draft.logo_preview_data ? <img src={draft.logo_preview_data} alt="" className="w-full h-full object-contain" /> : <Pencil size={18} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-amber-900">{draft.mark_name ? `"${draft.mark_name}" — ` : ''}{tri('Draft Filing in Progress', '草稿申请进行中', 'Borrador en progreso', 'Entwurf in Bearbeitung', 'Brouillon en cours', 'ड्राफ्ट प्रगति में', 'Rascunho em andamento', '下書き作成中')}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{tri('Step', '步骤', 'Paso', 'Schritt', 'Étape', 'चरण', 'Etapa', 'ステップ')} {draft.current_step} {tri('of 6', '共6步', 'de 6', 'von 6', 'sur 6', '/ 6', 'de 6', '/ 6')} &middot; {tri('Last saved', '最后保存', 'Guardado', 'Zuletzt gespeichert', 'Dernière sauvegarde', 'अंतिम सहेजा', 'Último salvo', '最終保存')} {new Date(draft.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to="/apply?resume=1" className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors">{tri('Continue', '继续', 'Continuar', 'Fortfahren', 'Continuer', 'जारी रखें', 'Continuar', '続ける')} <ChevronRight size={13} /></Link>
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

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2d5a2d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <DocketTable
                  rows={docketRows}
                  onRefresh={loadDocket}
                  onViewDetail={id => { setSelectedAppId(id); setView('detail'); }}
                />
              )}
            </>
          )}

          {/* Detail view */}
          {view === 'detail' && selectedAppId && (
            <ApplicationDetail appId={selectedAppId} onBack={() => { setView('docket'); setSelectedAppId(null); }} />
          )}

          {/* Search Reports view */}
          {view === 'reports' && (
            <>
              <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{tri('Search Reports', '搜索报告', 'Informes de búsqueda', 'Suchberichte', 'Rapports de recherche', 'खोज रिपोर्ट', 'Relatórios de busca', '検索レポート')}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">{tri('Trademark clearance reports you have purchased', '您购买的商标检索报告', 'Informes de disponibilidad de marca adquiridos', 'Erworbene Markenrecherche-Berichte', 'Rapports de disponibilité de marque achetés', 'आपके द्वारा खरीदी गई ट्रेडमार्क क्लीयरेंस रिपोर्ट', 'Relatórios de disponibilidade de marca adquiridos', '購入した商標調査レポート')}</p>
                </div>
                <button onClick={loadReports} disabled={reportsLoading} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} /> {tri('Refresh', '刷新', 'Actualizar')}
                </button>
              </div>

              {reportsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-[#2d5a2d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reports.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-14 h-14 bg-[#f0f7f0] rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSearch size={24} className="text-[#2d5a2d]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-2">No search reports yet</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Run a trademark clearance check and purchase the full PDF report to see it here.</p>
                  <Link to="/trademark-check" className="inline-flex items-center gap-2 bg-[#1a2e1a] hover:bg-[#2d5a2d] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                    <FileSearch size={15} /> Run a Trademark Search
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Mark Name</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Goods / Services</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Amount</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reports.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#f0f7f0] rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Shield size={14} className="text-[#2d5a2d]" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{r.mark_name}</p>
                                  <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 hidden md:table-cell">
                              <p className="text-gray-600 text-xs max-w-[200px] truncate">{r.goods_services || '—'}</p>
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell text-gray-600">
                              {r.paid_at ? new Date(r.paid_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td className="px-5 py-4 hidden sm:table-cell text-right text-gray-700 font-medium">
                              USD ${Number(r.final_amount_usd).toFixed(2)}
                            </td>
                            <td className="px-5 py-4 text-right">
                              {r.pdf_storage_path ? (
                                <button
                                  onClick={() => handleDownloadReport(r.id)}
                                  disabled={downloadingId === r.id}
                                  className="inline-flex items-center gap-1.5 bg-[#c9a84c] hover:bg-[#b8963e] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                                >
                                  {downloadingId === r.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                  PDF
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                                  <Loader2 size={12} className="animate-spin" /> Generating…
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Settings */}
          {view === 'settings' && (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900">{tri('Account Settings', '账户设置', 'Configuración de cuenta', 'Kontoeinstellungen', 'Paramètres du compte', 'खाता सेटिंग', 'Configurações da conta', 'アカウント設定')}</h1>
                {profile?.password_change_required && (
                  <div className="mt-2 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <Bell size={14} /> {tri('Please set a personal password to secure your account.', '请设置个人密码以保护您的账户。', 'Por favor establece una contraseña personal para asegurar tu cuenta.', 'Bitte setzen Sie ein persönliches Passwort.', 'Veuillez définir un mot de passe personnel.', 'कृपया अपना खाता सुरक्षित करने के लिए व्यक्तिगत पासवर्ड सेट करें।', 'Por favor defina uma senha pessoal para proteger sua conta.', '個人パスワードを設定してアカウントを保護してください。')}
                  </div>
                )}
              </div>
              <AccountSettings language={language} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
