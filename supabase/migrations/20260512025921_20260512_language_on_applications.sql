/*
  # Move language preference from clients/profiles to applications

  ## Summary
  The user's browsing language at the time of payment is the authoritative language
  for confirmation emails and filing communications. This migration moves the language
  field from the client/profile record (set at form-fill time, may differ from payment
  time) to the applications table (set at payment time from the live site language context).

  ## Changes

  ### Modified Tables
  - `applications`
    - ADD `language` (text, default 'en') — the site language active when the user paid;
      constrained to the 8 supported codes
  - `clients`
    - DROP `preferred_language` column (no longer needed; language is now per-application)
  - `profiles`
    - DROP `preferred_language` column (no longer needed)

  ## Notes
  - Existing applications get `language = 'en'` as a safe default
  - RLS is unchanged — the new column on applications is covered by existing policies
*/

-- 1. Add language column to applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'language'
  ) THEN
    ALTER TABLE public.applications
      ADD COLUMN language text NOT NULL DEFAULT 'en'
        CHECK (language IN ('en','zh','es','de','fr','hi','pt','ja'));
  END IF;
END $$;

-- 2. Drop preferred_language from clients
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE public.clients DROP COLUMN preferred_language;
  END IF;
END $$;

-- 3. Drop preferred_language from profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN preferred_language;
  END IF;
END $$;
