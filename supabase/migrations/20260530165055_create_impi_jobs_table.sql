/*
  # Create impi_jobs table

  ## Purpose
  Persistent job tracking for the IMPI autofill Playwright worker. Each submission
  creates one row. The worker writes progress updates throughout its run so that
  the status page can poll and display real-time state.

  ## New Tables
  - `impi_jobs`
    - `id` (uuid, primary key) — matches the jobId generated in submit.ts
    - `created_at` (timestamptz) — when the job was queued
    - `updated_at` (timestamptz) — last status update
    - `status` (text) — one of: queued | running | done | failed
    - `current_step` (text) — last step name reported by the worker
    - `application_id` (text) — IMPI application/solicitud number captured on success
    - `mark_name` (text) — denominacion submitted
    - `cliente_nombre` (text) — client name from the form
    - `cliente_email` (text) — client email from the form
    - `error_message` (text) — failure details if status = failed
    - `screenshot_url` (text) — signed URL for the screenshot stored in Supabase Storage
    - `completed_at` (timestamptz) — when the job finished (success or failure)

  ## Security
  - RLS enabled; no anon access
  - Service role (used by the Vercel worker via SUPABASE_SERVICE_ROLE_KEY) bypasses RLS
  - Authenticated admin users can SELECT/UPDATE
*/

CREATE TABLE IF NOT EXISTS impi_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'done', 'failed')),
  current_step text NOT NULL DEFAULT 'queued',
  application_id text,
  mark_name text NOT NULL DEFAULT '',
  cliente_nombre text NOT NULL DEFAULT '',
  cliente_email text NOT NULL DEFAULT '',
  error_message text,
  screenshot_url text,
  completed_at timestamptz
);

ALTER TABLE impi_jobs ENABLE ROW LEVEL SECURITY;

-- Admin/staff authenticated users can read all jobs
CREATE POLICY "Authenticated users can read impi_jobs"
  ON impi_jobs FOR SELECT
  TO authenticated
  USING (true);

-- Service role handles all writes via the Vercel worker (bypasses RLS).
-- No insert/update policies needed for client-side — all writes come from the server.

-- Keep updated_at fresh automatically
CREATE OR REPLACE FUNCTION update_impi_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER impi_jobs_updated_at
  BEFORE UPDATE ON impi_jobs
  FOR EACH ROW EXECUTE FUNCTION update_impi_jobs_updated_at();
