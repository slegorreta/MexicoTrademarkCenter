/*
  # Add disclaimer acceptance columns to applications

  ## Summary
  Adds auditable fields to the applications table to record that the user
  explicitly acknowledged the no-guarantee and no-refund disclaimer at the
  time of filing, as required by the updated filing flow.

  ## New Columns
  - `terms_accepted` (boolean, default false) — user checked "I agree to Terms of Service"
  - `disclaimer_accepted` (boolean, default false) — user checked the no-guarantee/no-refund acknowledgment
  - `disclaimer_accepted_at` (timestamptz) — timestamp when the disclaimer was accepted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'terms_accepted'
  ) THEN
    ALTER TABLE applications ADD COLUMN terms_accepted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'disclaimer_accepted'
  ) THEN
    ALTER TABLE applications ADD COLUMN disclaimer_accepted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'disclaimer_accepted_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN disclaimer_accepted_at timestamptz;
  END IF;
END $$;
