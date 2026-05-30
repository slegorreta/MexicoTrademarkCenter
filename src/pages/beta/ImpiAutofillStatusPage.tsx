import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

type JobStatus = 'queued' | 'running' | 'done' | 'failed';

interface ImpiJob {
  id: string;
  created_at: string;
  updated_at: string;
  status: JobStatus;
  current_step: string;
  application_id: string | null;
  mark_name: string;
  cliente_nombre: string;
  cliente_email: string;
  error_message: string | null;
  screenshot_url: string | null;
  completed_at: string | null;
}

const STEP_LABELS: Record<string, string> = {
  queued: 'Queued — waiting for worker',
  setup: 'Setting up browser',
  'connect-browser': 'Connecting to remote browser',
  'navigate-login': 'Navigating to IMPI login',
  login: 'Logging in to IMPI',
  'navigate-marca-en-linea': 'Opening Marca en Línea',
  'accept-privacy-marca': 'Accepting privacy notice',
  'dismiss-welcome': 'Dismissing welcome dialog',
  'fill-tab1-trademark-type': 'Tab 1 — Selecting trademark type',
  'fill-tab1-text-fields': 'Tab 1 — Filling mark name',
  'upload-logo': 'Tab 1 — Uploading logo',
  'tab1-siguiente': 'Tab 1 — Moving to next tab',
  'fill-tab2-classification': 'Tab 2 — Filling products & services',
  'tab2-siguiente': 'Tab 2 — Moving to next tab',
  'fill-tab3-owner-type': 'Tab 3 — Selecting owner type',
  'fill-tab3-nationality': 'Tab 3 — Setting nationality',
  'fill-tab3-owner-details': 'Tab 3 — Filling owner details',
  'tab3-agregar-dueno': 'Tab 3 — Adding owner',
  'tab3-siguiente': 'Tab 3 — Moving to next tab',
  'fill-tab4-prior-use': 'Tab 4 — Filling prior use',
  'tab4-siguiente': 'Tab 4 — Moving to next tab',
  'fill-tab5-signatory': 'Tab 5 — Filling signatory address',
  'tab5-siguiente': 'Tab 5 — Moving to next tab',
  'fill-tab6-priority': 'Tab 6 — Priority claim',
  'extract-application-id': 'Extracting IMPI application ID',
  'save-results': 'Saving results',
  'send-success-email': 'Sending confirmation email',
  done: 'Complete',
};

const STEP_ORDER = [
  'queued', 'connect-browser', 'navigate-login', 'login',
  'navigate-marca-en-linea', 'accept-privacy-marca', 'dismiss-welcome',
  'fill-tab1-trademark-type', 'fill-tab1-text-fields', 'tab1-siguiente',
  'fill-tab2-classification', 'tab2-siguiente',
  'fill-tab3-owner-type', 'fill-tab3-nationality', 'fill-tab3-owner-details',
  'tab3-agregar-dueno', 'tab3-siguiente',
  'fill-tab4-prior-use', 'tab4-siguiente',
  'fill-tab5-signatory', 'tab5-siguiente',
  'fill-tab6-priority', 'extract-application-id', 'save-results',
  'send-success-email', 'done',
];

function progressPercent(step: string, status: JobStatus): number {
  if (status === 'done') return 100;
  if (status === 'failed') return 100;
  const idx = STEP_ORDER.indexOf(step);
  if (idx < 0) return 5;
  return Math.round(((idx + 1) / STEP_ORDER.length) * 95);
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function StatusBadge({ status }: { status: JobStatus }) {
  const styles: Record<JobStatus, { bg: string; text: string; label: string }> = {
    queued:  { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Queued' },
    running: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Running' },
    done:    { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
    failed:  { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
  };
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {status === 'running' && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      )}
      {s.label}
    </span>
  );
}

export default function ImpiAutofillStatusPage() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId') ?? '';
  const token = searchParams.get('token') ?? '';

  const [job, setJob] = useState<ImpiJob | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;

    async function fetch() {
      const { data, error } = await supabase
        .from('impi_jobs')
        .select('*')
        .eq('id', jobId)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setJob(data as ImpiJob);
      setLastRefresh(new Date());

      // Keep polling while the job is still in progress
      if (data.status === 'queued' || data.status === 'running') {
        setTimeout(fetch, 3000);
      }
    }

    fetch();
    return () => { cancelled = true; };
  }, [jobId]);

  // No jobId in URL — show a lookup form
  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
          <h1 className="text-lg font-bold text-gray-800 mb-2">IMPI Job Status</h1>
          <p className="text-sm text-gray-500">No job ID provided. Submit a new application to track it here.</p>
          {token && (
            <Link
              to={`/beta/impi-autofill?token=${token}`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg"
            >
              New application
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-8 shadow-sm text-center">
          <h1 className="text-lg font-bold text-red-700 mb-2">Job not found</h1>
          <p className="text-sm text-gray-500">Job ID <code className="bg-gray-100 px-1 rounded text-xs">{jobId}</code> was not found in the database.</p>
          <p className="text-xs text-gray-400 mt-2">This may mean the submission failed before it could be recorded.</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-sm text-gray-500 animate-pulse">Loading job status...</div>
      </div>
    );
  }

  const pct = progressPercent(job.current_step, job.status);
  const stepLabel = STEP_LABELS[job.current_step] ?? job.current_step;
  const isActive = job.status === 'queued' || job.status === 'running';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">IMPI Autofill — Job Status</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Job ID: <code className="bg-gray-100 px-1 rounded">{job.id.slice(0, 8)}…</code>
              {' · '}Submitted {formatTime(job.created_at)}
              {' · '}Last updated {formatTime(lastRefresh.toISOString())}
              {isActive && <span className="ml-1 text-blue-500 animate-pulse">· polling</span>}
            </p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Progress bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{stepLabel}</span>
            <span className="text-sm font-semibold text-gray-500">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                job.status === 'failed' ? 'bg-red-500' :
                job.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Application Details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-gray-500">Mark name</dt>
            <dd className="font-medium text-gray-900">{job.mark_name || '—'}</dd>
            <dt className="text-gray-500">Client</dt>
            <dd className="font-medium text-gray-900">{job.cliente_nombre || '—'}</dd>
            <dt className="text-gray-500">Client email</dt>
            <dd className="font-medium text-gray-900">{job.cliente_email || '—'}</dd>
            {job.application_id && (
              <>
                <dt className="text-gray-500">IMPI Application ID</dt>
                <dd className="font-bold text-green-700">{job.application_id}</dd>
              </>
            )}
            {job.completed_at && (
              <>
                <dt className="text-gray-500">Completed at</dt>
                <dd className="font-medium text-gray-900">{formatTime(job.completed_at)}</dd>
              </>
            )}
          </dl>
        </div>

        {/* Success state */}
        {job.status === 'done' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-green-800 mb-1">Draft saved successfully</h2>
            <p className="text-sm text-green-700">
              The IMPI draft has been saved. Application ID: <strong>{job.application_id ?? 'see IMPI portal'}</strong>.
              A confirmation email was sent to the attorney.
            </p>
            {job.screenshot_url && (
              <a
                href={job.screenshot_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 underline underline-offset-2"
              >
                View screenshot
              </a>
            )}
          </div>
        )}

        {/* Failure state */}
        {job.status === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-red-800 mb-1">Job failed at step: <code className="font-mono">{job.current_step}</code></h2>
            {job.error_message && (
              <pre className="mt-2 text-xs bg-red-100 text-red-800 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                {job.error_message}
              </pre>
            )}
          </div>
        )}

        {/* Action links */}
        <div className="flex items-center gap-3">
          {token && (
            <Link
              to={`/beta/impi-autofill?token=${token}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              New application
            </Link>
          )}
          <p className="text-xs text-gray-400">Beta — internal use only</p>
        </div>

      </div>
    </div>
  );
}
