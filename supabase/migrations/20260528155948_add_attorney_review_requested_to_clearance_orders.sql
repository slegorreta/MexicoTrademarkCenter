/*
  # Add attorney_review_requested to clearance_report_orders

  Adds a boolean flag to record when a user opts into the attorney review
  add-on during checkout. Day 1 this is a lead-capture only — no charge is
  made. The flag lets staff follow up manually and will drive the Day 4
  billing flow.

  1. Changes
    - `clearance_report_orders`: new column `attorney_review_requested` (boolean, default false)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clearance_report_orders' AND column_name = 'attorney_review_requested'
  ) THEN
    ALTER TABLE clearance_report_orders ADD COLUMN attorney_review_requested boolean NOT NULL DEFAULT false;
  END IF;
END $$;
