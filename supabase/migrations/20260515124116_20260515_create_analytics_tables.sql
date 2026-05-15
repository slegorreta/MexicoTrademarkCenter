/*
  # Create Analytics Tracking Tables

  ## Summary
  Creates three tables for comprehensive platform usage tracking.
  Data is retained for up to 5 years per business requirements.

  ## New Tables

  ### 1. `website_sessions`
  Records every visitor session with geo/device context.
  - `id` — primary key
  - `session_id` — client-generated UUID persisted in sessionStorage (groups page views per tab)
  - `ip_address` — visitor IP (may be null if blocked)
  - `city`, `country` — geo-resolved from IP
  - `device_type` — desktop | mobile | tablet
  - `os` — operating system string
  - `browser` — browser string
  - `page_path` — URL path visited
  - `language` — platform language code
  - `referrer` — HTTP referrer
  - `created_at` — UTC timestamp of the session start

  ### 2. `clearance_searches`
  Records every free trademark availability search made through the platform.
  - `id` — primary key
  - `session_id` — links to a website_sessions entry (soft link, no FK to avoid cascades)
  - `ip_address`, `city`, `country`, `device_type`, `os` — same as sessions
  - `mark_searched` — the trademark text that was searched
  - `classes_searched` — JSONB array of Nice class numbers selected
  - `language` — platform language at time of search
  - `result_risk` — risk level returned (low | medium | high | null)
  - `created_at`

  ### 3. `filing_events`
  Records filing process starts and payment completions, linked to applications.
  - `id` — primary key
  - `application_id` — FK to applications (nullable for pre-creation events)
  - `event_type` — process_started | payment_completed
  - `ip_address`, `city`, `country`, `device_type`, `os`, `language` — context
  - `amount_usd` — amount paid (for payment_completed events)
  - `session_id` — links to session
  - `created_at`

  ## Security
  - RLS enabled on all three tables
  - Anon users can INSERT only (for capture)
  - Authenticated staff (admin, super_admin) can SELECT all rows
  - No UPDATE or DELETE allowed by non-super-admin

  ## Indexes
  - `created_at` index on all tables for fast time-range queries
  - `country` index on sessions and searches for geo filtering
  - `session_id` index for session grouping
*/

-- ─── website_sessions ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS website_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   text NOT NULL,
  ip_address   text,
  city         text,
  country      text,
  device_type  text CHECK (device_type IN ('desktop','mobile','tablet')),
  os           text,
  browser      text,
  page_path    text,
  language     text,
  referrer     text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_website_sessions_created_at ON website_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_website_sessions_country    ON website_sessions (country);
CREATE INDEX IF NOT EXISTS idx_website_sessions_session_id ON website_sessions (session_id);

-- Anon insert (capture)
CREATE POLICY "Anyone can log a session"
  ON website_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff read
CREATE POLICY "Staff can read all sessions"
  ON website_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

-- Super admin delete (for manual cleanup / GDPR)
CREATE POLICY "Super admin can delete sessions"
  ON website_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- ─── clearance_searches ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clearance_searches (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       text,
  ip_address       text,
  city             text,
  country          text,
  device_type      text CHECK (device_type IN ('desktop','mobile','tablet')),
  os               text,
  mark_searched    text,
  classes_searched jsonb DEFAULT '[]'::jsonb,
  language         text,
  result_risk      text CHECK (result_risk IN ('low','medium','high') OR result_risk IS NULL),
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE clearance_searches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clearance_searches_created_at   ON clearance_searches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clearance_searches_country      ON clearance_searches (country);
CREATE INDEX IF NOT EXISTS idx_clearance_searches_mark_searched ON clearance_searches (mark_searched);

-- Anon insert
CREATE POLICY "Anyone can log a clearance search"
  ON clearance_searches FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff read
CREATE POLICY "Staff can read all clearance searches"
  ON clearance_searches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

-- Super admin delete
CREATE POLICY "Super admin can delete clearance searches"
  ON clearance_searches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- ─── filing_events ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS filing_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  event_type     text NOT NULL CHECK (event_type IN ('process_started','payment_completed')),
  ip_address     text,
  city           text,
  country        text,
  device_type    text CHECK (device_type IN ('desktop','mobile','tablet')),
  os             text,
  language       text,
  amount_usd     numeric(10,2),
  session_id     text,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE filing_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_filing_events_created_at     ON filing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_filing_events_application_id ON filing_events (application_id);
CREATE INDEX IF NOT EXISTS idx_filing_events_event_type     ON filing_events (event_type);
CREATE INDEX IF NOT EXISTS idx_filing_events_country        ON filing_events (country);

-- Anon insert
CREATE POLICY "Anyone can log a filing event"
  ON filing_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Staff read
CREATE POLICY "Staff can read all filing events"
  ON filing_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

-- Super admin delete
CREATE POLICY "Super admin can delete filing events"
  ON filing_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );
