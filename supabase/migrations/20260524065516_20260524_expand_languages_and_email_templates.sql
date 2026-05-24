/*
  # Expand Language Support and Email Template Columns

  ## Summary
  Expands the language system from 2-3 supported languages to all 8 languages
  supported by the public website.

  ## Changes

  ### 1. profiles table
  - Adds preferred_language column (text, default 'en') with CHECK for all 8 languages

  ### 2. clients table
  - Adds preferred_language column (text, default 'en') with CHECK for all 8 languages

  ### 3. email_templates table
  - Adds 6 new language column pairs: subject/body for es, de, fr, hi, pt, ja

  ## Notes
  1. All columns are added with IF NOT EXISTS guards to be idempotent
  2. No existing data is modified or deleted
  3. applications.language already exists and covers submission language
*/

-- ── 1. Add preferred_language to profiles ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_language') THEN
    ALTER TABLE profiles
      ADD COLUMN preferred_language text DEFAULT 'en'
        CHECK (preferred_language IN ('en','zh','es','de','fr','hi','pt','ja'));
  END IF;
END $$;

-- ── 2. Add preferred_language to clients ──────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='preferred_language') THEN
    ALTER TABLE clients
      ADD COLUMN preferred_language text DEFAULT 'en'
        CHECK (preferred_language IN ('en','zh','es','de','fr','hi','pt','ja'));
  END IF;
END $$;

-- ── 3. Add new language columns to email_templates ───────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_es') THEN
    ALTER TABLE email_templates ADD COLUMN subject_es text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_es') THEN
    ALTER TABLE email_templates ADD COLUMN body_es text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_de') THEN
    ALTER TABLE email_templates ADD COLUMN subject_de text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_de') THEN
    ALTER TABLE email_templates ADD COLUMN body_de text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_fr') THEN
    ALTER TABLE email_templates ADD COLUMN subject_fr text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_fr') THEN
    ALTER TABLE email_templates ADD COLUMN body_fr text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_hi') THEN
    ALTER TABLE email_templates ADD COLUMN subject_hi text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_hi') THEN
    ALTER TABLE email_templates ADD COLUMN body_hi text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_pt') THEN
    ALTER TABLE email_templates ADD COLUMN subject_pt text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_pt') THEN
    ALTER TABLE email_templates ADD COLUMN body_pt text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='subject_ja') THEN
    ALTER TABLE email_templates ADD COLUMN subject_ja text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_templates' AND column_name='body_ja') THEN
    ALTER TABLE email_templates ADD COLUMN body_ja text;
  END IF;
END $$;
