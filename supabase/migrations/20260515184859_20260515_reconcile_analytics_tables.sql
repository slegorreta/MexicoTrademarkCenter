/*
  # Reconcile Analytics Tables

  These tables already exist in the live database but were created outside
  the tracked migrations. This migration documents them for schema history
  completeness using IF NOT EXISTS guards so it is safe to re-run.

  1. Tables Documented
    - `website_sessions` — tracks visitor sessions with device/geo info
    - `clearance_searches` — logs trademark clearance searches performed
    - `filing_events` — logs payment and filing events per application

  2. No destructive operations — purely additive / idempotent
*/

CREATE TABLE IF NOT EXISTS website_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  ip_address text,
  city text,
  country text,
  device_type text,
  os text,
  browser text,
  page_path text,
  language text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clearance_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  ip_address text,
  city text,
  country text,
  device_type text,
  os text,
  mark_searched text,
  classes_searched jsonb,
  language text,
  result_risk text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS filing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid,
  event_type text NOT NULL,
  ip_address text,
  city text,
  country text,
  device_type text,
  os text,
  language text,
  amount_usd numeric,
  session_id text,
  created_at timestamptz DEFAULT now()
);
