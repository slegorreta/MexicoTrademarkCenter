/*
  # Conversion Tracking Tables

  Adds two new tables for conversion instrumentation and optional email capture.
  These are ADDITIVE — no existing tables are altered.

  1. New Tables
    - `conversion_events`: Tracks user funnel events (report_viewed, cta_clicked, etc.)
      - `id` (uuid, PK)
      - `order_ref` (varchar 8, nullable) — short reference to clearance report order
      - `event` (varchar 40, NOT NULL) — event name
      - `properties` (jsonb, nullable) — arbitrary event metadata
      - `language` (varchar 2, nullable) — user language at time of event
      - `created_at` (timestamptz, default NOW())
    - `report_email_captures`: Optional email opt-in from report page
      - `id` (uuid, PK)
      - `order_ref` (varchar 8, nullable)
      - `email` (varchar 255, NOT NULL)
      - `language` (varchar 2, nullable)
      - `created_at` (timestamptz, default NOW())

  2. Indexes
    - `idx_conversion_events` on (event, created_at) for quick funnel queries

  3. Security
    - RLS enabled on both tables
    - Anon users can INSERT (events/captures come from unauthenticated report views)
    - Authenticated admins can SELECT
*/

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ref VARCHAR(8),
  event VARCHAR(40) NOT NULL,
  properties JSONB,
  language VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events ON conversion_events(event, created_at);

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert conversion events"
  ON conversion_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read conversion events"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );

CREATE TABLE IF NOT EXISTS report_email_captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_ref VARCHAR(8),
  email VARCHAR(255) NOT NULL,
  language VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE report_email_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert email captures"
  ON report_email_captures FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read email captures"
  ON report_email_captures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'superadmin', 'staff')
    )
  );
