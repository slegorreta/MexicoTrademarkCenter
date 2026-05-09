/*
  # Portal Enhancements Migration

  ## Summary
  Adds all tables and columns needed to support:
  1. Separate client and admin portals
  2. Automated post-payment email flow
  3. Staff-created applications with payment links
  4. Client portal account auto-creation
  5. Application timeline tracking
  6. Document visibility controls

  ## New Tables
  - `timeline_events` — tracks every status change and action on an application, with client-visible flag
  - `email_log` — audit trail of every email sent by the system
  - `staff_payment_links` — stores Stripe Payment Links created by staff for manual invoicing

  ## Modified Tables
  - `profiles` — adds `password_change_required`, `staff_created` flags
  - `uploaded_files` — adds `visible_to_client` flag

  ## Security
  - RLS enabled on all new tables
  - Clients can only see timeline events and files marked visible to them
  - Staff can see everything
*/

-- ============================================================
-- 1. profiles: add portal account flags
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'password_change_required'
  ) THEN
    ALTER TABLE profiles ADD COLUMN password_change_required boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'staff_created'
  ) THEN
    ALTER TABLE profiles ADD COLUMN staff_created boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 2. uploaded_files: add client visibility flag
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploaded_files' AND column_name = 'visible_to_client'
  ) THEN
    ALTER TABLE uploaded_files ADD COLUMN visible_to_client boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 3. timeline_events table
-- ============================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL DEFAULT 'custom',
  -- valid: payment_confirmed, status_change, document_uploaded, note_added,
  --        email_sent, staff_comment, filing_instruction_sent, custom
  title text NOT NULL,
  description text,
  is_visible_to_client boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_events_application_id_idx ON timeline_events(application_id);
CREATE INDEX IF NOT EXISTS timeline_events_created_at_idx ON timeline_events(created_at DESC);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all timeline events"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Clients can view their visible timeline events"
  ON timeline_events FOR SELECT
  TO authenticated
  USING (
    is_visible_to_client = true
    AND EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = timeline_events.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert timeline events"
  ON timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

CREATE POLICY "Staff can update timeline events"
  ON timeline_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

-- ============================================================
-- 4. email_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  template_key text,
  subject text,
  status text NOT NULL DEFAULT 'pending',
  -- valid: pending, sent, failed
  resend_message_id text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_log_application_id_idx ON email_log(application_id);
CREATE INDEX IF NOT EXISTS email_log_created_at_idx ON email_log(created_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all email logs"
  ON email_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "System can insert email logs"
  ON email_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- 5. staff_payment_links table
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_payment_link_url text NOT NULL,
  stripe_payment_link_id text,
  amount_usd numeric(10,2) NOT NULL,
  email_sent_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_payment_links_application_id_idx ON staff_payment_links(application_id);

ALTER TABLE staff_payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payment links"
  ON staff_payment_links FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
    )
  );

CREATE POLICY "Staff can insert payment links"
  ON staff_payment_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

CREATE POLICY "Staff can update payment links"
  ON staff_payment_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff')
    )
  );

-- ============================================================
-- 6. uploaded_files RLS update: clients see visible files
-- ============================================================
DO $$
BEGIN
  -- Drop old permissive client policy if exists, replace with scoped one
  DROP POLICY IF EXISTS "Clients can view their files" ON uploaded_files;
END $$;

CREATE POLICY "Clients can view their visible files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    (
      -- Staff can see all
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin','admin','docketing_staff','filing_staff','read_only')
      )
    ) OR (
      -- Clients only see visible files on their applications
      visible_to_client = true
      AND EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = uploaded_files.application_id
        AND applications.user_id = auth.uid()
      )
    )
  );
