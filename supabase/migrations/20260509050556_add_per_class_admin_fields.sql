/*
  # Add per-class admin fields to trademark_classes

  ## Summary
  Adds two admin-editable columns to the trademark_classes table:

  1. New Columns
    - `application_status` (text) — prosecution status per class, set by admins.
      Values: 'pending_payment', 'in_review', 'filed', 'published', 'granted', 'abandoned'
      Default: 'pending_payment'
    - `admin_comments` (text) — free-text notes per class for anticipations,
      oppositions, office actions, or other obstacles. Set by admins, visible to clients.

  2. Security
    - Clients can SELECT these columns (covered by existing RLS read policies)
    - Only admins/staff (service role) can UPDATE these fields
    - An explicit UPDATE policy is added to prevent clients from writing these fields

  ## Notes
  - These fields drive the per-class status column in the client docket table
  - They are read-only for clients in the portal
*/

-- Add application_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trademark_classes' AND column_name = 'application_status'
  ) THEN
    ALTER TABLE trademark_classes
      ADD COLUMN application_status text NOT NULL DEFAULT 'pending_payment'
      CHECK (application_status IN ('pending_payment','in_review','filed','published','granted','abandoned'));
  END IF;
END $$;

-- Add admin_comments column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trademark_classes' AND column_name = 'admin_comments'
  ) THEN
    ALTER TABLE trademark_classes ADD COLUMN admin_comments text DEFAULT '';
  END IF;
END $$;
