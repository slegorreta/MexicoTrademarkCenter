/*
  # Create filing_drafts table

  ## Purpose
  Persists in-progress trademark filing wizard state so users can leave and return to continue where they left off.

  ## New Tables
  - `filing_drafts`
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users) — set for authenticated users
    - `session_key` (text) — anonymous session identifier for guests (browser-generated UUID stored in localStorage)
    - `current_step` (int) — the last completed step (1-6), so user resumes at next step
    - `mark_name` (text) — mark name for display in dashboard
    - `form_data` (jsonb) — full serialized FormData state (excluding File objects)
    - `class_entries` (jsonb) — serialized ClassEntry array
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Authenticated users can only access their own drafts (by user_id)
  - Drafts are deleted after payment succeeds (handled in app logic)

  ## Notes
  - The logoFile (File object) cannot be serialized to JSON; logo preview (base64 data URL) is stored instead as logo_preview_data
  - One draft per user is enforced via unique constraint on user_id (when not null)
*/

CREATE TABLE IF NOT EXISTS filing_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_key text,
  current_step int NOT NULL DEFAULT 1,
  mark_name text DEFAULT '',
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  class_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  logo_preview_data text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only one draft per authenticated user
CREATE UNIQUE INDEX IF NOT EXISTS filing_drafts_user_id_unique
  ON filing_drafts (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE filing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own drafts"
  ON filing_drafts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON filing_drafts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
  ON filing_drafts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON filing_drafts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
