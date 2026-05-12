/*
  # Add search_language and clearance_report_order_id to applications

  1. Changes to `applications`
     - `search_language` (text, default 'en') — the UI language the user had active
       when they conducted the trademark availability/clearance search that led to
       this filing. Used to send the client confirmation email in their language.
     - `clearance_report_order_id` (uuid, nullable, FK → clearance_report_orders.id)
       — optional link to the clearance report order the user purchased before filing,
       allowing the platform to correlate the two records.

  2. Security
     - No RLS changes needed: existing application policies already cover these columns.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'search_language'
  ) THEN
    ALTER TABLE applications ADD COLUMN search_language text NOT NULL DEFAULT 'en'
      CHECK (search_language IN ('en','es','zh','de','fr','hi','pt','ja'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'clearance_report_order_id'
  ) THEN
    ALTER TABLE applications ADD COLUMN clearance_report_order_id uuid
      REFERENCES clearance_report_orders(id) ON DELETE SET NULL;
  END IF;
END $$;
