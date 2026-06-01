/*
  # Add user_id and user_email to clearance_searches

  The daily digest needs to identify who ran each search.
  These columns are nullable — anonymous searches leave them null.

  Changes:
  - Add `user_id` (uuid, nullable) — auth.uid() if the user was logged in
  - Add `user_email` (text, nullable) — email snapshot for the digest
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clearance_searches' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clearance_searches ADD COLUMN user_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clearance_searches' AND column_name = 'user_email'
  ) THEN
    ALTER TABLE clearance_searches ADD COLUMN user_email text;
  END IF;
END $$;
