/*
  # Expand preferred_language check constraint on clients table

  The existing constraint only allowed 'en', 'zh', 'es' but the application
  supports de, fr, hi, pt, ja as well. Any user with a non-English/Chinese/Spanish
  browser language would get a 409 conflict on filing.
*/

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_preferred_language_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_preferred_language_check
  CHECK (preferred_language = ANY (ARRAY['en','zh','es','de','fr','hi','pt','ja']));
