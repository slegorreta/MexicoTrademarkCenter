/*
  # Create token_usage_log table

  Tracks OpenAI API token consumption per clearance search so we can:
  - Append estimated USD cost to admin copy of each report
  - Aggregate daily/weekly/monthly/yearly cost in the nightly digest email

  ## New Tables
  - `token_usage_log`
    - `id` (uuid PK)
    - `mark_name` (text) — the trademark searched
    - `session_ref` (text, nullable) — opaque reference linking to clearance_searches
    - `model` (text) — OpenAI model name (e.g. gpt-4o, gpt-4o-mini)
    - `prompt_tokens` (integer)
    - `completion_tokens` (integer)
    - `total_tokens` (integer)
    - `cost_usd` (numeric(12,6)) — computed from per-model pricing
    - `source` (text) — which function produced the call (e.g. verify-trademark)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled; no public access
  - Service role can INSERT (edge functions use service role key)
  - Authenticated admins (role in app_metadata) can SELECT
*/

CREATE TABLE IF NOT EXISTS token_usage_log (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_name        text NOT NULL DEFAULT '',
  session_ref      text,
  model            text NOT NULL DEFAULT '',
  prompt_tokens    integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  total_tokens     integer NOT NULL DEFAULT 0,
  cost_usd         numeric(12, 6) NOT NULL DEFAULT 0,
  source           text NOT NULL DEFAULT 'verify-trademark',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_usage_log_created_at ON token_usage_log (created_at);
CREATE INDEX IF NOT EXISTS idx_token_usage_log_mark_name   ON token_usage_log (mark_name);

ALTER TABLE token_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read token usage"
  ON token_usage_log FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin', 'staff')
  );
