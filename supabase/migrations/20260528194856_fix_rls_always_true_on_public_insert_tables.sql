/*
  # Fix RLS "always true" INSERT policies on conversion_events and report_email_captures

  Both tables are intentionally writable by anonymous users (public report page analytics),
  but the previous WITH CHECK (true) allows inserting arbitrary data with no validation.

  This migration:
  1. Drops the open-ended INSERT policies on both tables.
  2. Replaces them with constrained policies that enforce the minimum shape of valid data:
     - conversion_events: event must be one of the known ConversionEvent enum values
     - report_email_captures: email must pass a basic format check (contains @ and .)

  Admins can still read all rows via the existing SELECT policies (unchanged).
*/

-- ─── conversion_events ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert conversion events" ON conversion_events;

CREATE POLICY "Anon can insert valid conversion events"
  ON conversion_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    event IN (
      'report_viewed',
      'report_emailed',
      'report_cta_clicked',
      'attorney_review_requested',
      'payment_started',
      'payment_succeeded'
    )
  );

-- ─── report_email_captures ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert email captures" ON report_email_captures;

CREATE POLICY "Anon can insert valid email captures"
  ON report_email_captures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(trim(email)) > 3
    AND email LIKE '%@%.%'
  );
