/*
  # Widen preferred_language constraint to support all 8 UI languages

  ## Changes
  - profiles.preferred_language: drop old CHECK constraint (en/zh/es only) and add new one supporting en, zh, es, de, fr, hi, pt, ja
  - clients.preferred_language: same widening for consistency

  ## Notes
  - Existing data is unaffected (all existing values are already valid under the new constraint)
  - The app UI supports 8 languages; this aligns the DB constraint with that
*/

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_preferred_language_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_preferred_language_check
  CHECK (preferred_language IN ('en','zh','es','de','fr','hi','pt','ja'));

ALTER TABLE clients
  DROP CONSTRAINT IF EXISTS clients_preferred_language_check;

ALTER TABLE clients
  ADD CONSTRAINT clients_preferred_language_check
  CHECK (preferred_language IN ('en','zh','es','de','fr','hi','pt','ja'));
