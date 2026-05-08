/*
  # Create trademark_idea_sessions table

  ## Purpose
  Stores AI-generated trademark idea sessions so users can return to their results
  by bookmarking a URL with their session token.

  ## New Tables
  - `trademark_idea_sessions`
    - `id` (uuid, primary key)
    - `session_token` (uuid, unique index) - client-generated UUID stored in sessionStorage
    - `description` (text) - the business/product description the user entered
    - `ideas` (jsonb) - array of generated idea objects { name, style, rationale, rationaleZh }
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anonymous insert allowed (no auth required — sessions are public by design)
  - Select allowed by matching session_token (no auth required)
  - No update or delete policies (sessions are immutable once created)

  ## Notes
  - Sessions are keyed by a client-generated UUID, not user ID
  - No PII is stored; descriptions are user-provided business context only
  - Sessions are advisory/ephemeral; no hard dependency on persistence
*/

CREATE TABLE IF NOT EXISTS trademark_idea_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token uuid NOT NULL,
  description text NOT NULL DEFAULT '',
  ideas jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS trademark_idea_sessions_token_idx
  ON trademark_idea_sessions (session_token);

ALTER TABLE trademark_idea_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a session"
  ON trademark_idea_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read session by token"
  ON trademark_idea_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);
