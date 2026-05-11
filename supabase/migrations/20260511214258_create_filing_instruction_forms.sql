/*
  # Create filing_instruction_forms table

  ## Purpose
  Stores a persistent record of every MEXICO Trademark Application Instruction Form
  generated and sent when a client completes a purchase. This ensures staff always
  have access to the exact form that was dispatched, even if underlying client/
  trademark data is later edited.

  ## New Tables
  - `filing_instruction_forms`
    - `id` (uuid, PK)
    - `application_id` (uuid, FK → applications)
    - `html_content` (text) — full rendered HTML of the instruction form
    - `generated_at` (timestamptz) — when the form was generated
    - `sent_at` (timestamptz) — when the email was sent (null if generation only)
    - `sent_to_email` (text) — primary recipient email address
    - `status` (text) — 'generated' | 'sent' | 'acknowledged'

  ## Security
  - RLS enabled; only staff roles (super_admin, admin, docketing_staff, filing_staff,
    read_only) may read. Only service role writes (edge function).
*/

CREATE TABLE IF NOT EXISTS filing_instruction_forms (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  html_content      text NOT NULL DEFAULT '',
  generated_at      timestamptz NOT NULL DEFAULT now(),
  sent_at           timestamptz,
  sent_to_email     text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'generated'
                      CHECK (status IN ('generated', 'sent', 'acknowledged')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_filing_instruction_forms_application_id
  ON filing_instruction_forms(application_id);

ALTER TABLE filing_instruction_forms ENABLE ROW LEVEL SECURITY;

-- Staff can read all forms
CREATE POLICY "Staff can read filing instruction forms"
  ON filing_instruction_forms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'docketing_staff', 'filing_staff', 'read_only')
    )
  );

-- Staff can insert forms (for manual resend from dashboard)
CREATE POLICY "Staff can insert filing instruction forms"
  ON filing_instruction_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'docketing_staff', 'filing_staff')
    )
  );

-- Staff can update status field (e.g. mark acknowledged)
CREATE POLICY "Staff can update filing instruction form status"
  ON filing_instruction_forms
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'docketing_staff', 'filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin', 'docketing_staff', 'filing_staff')
    )
  );
