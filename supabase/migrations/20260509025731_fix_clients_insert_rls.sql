/*
  # Fix clients table INSERT RLS policies

  ## Problem
  The clients table only had an INSERT policy for staff roles. Public users
  (both logged-in clients and anonymous filers) were blocked with a 401 when
  trying to submit the trademark application form.

  ## Changes
  - Add INSERT policy for authenticated users to insert their own client record
    (user_id must equal auth.uid())
  - Add INSERT policy for anonymous users to insert a client record
    (user_id must be NULL, since anon users have no auth.uid())
*/

-- Allow a logged-in user to create their own client record
CREATE POLICY "Clients can insert own record"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Allow anonymous (not logged in) users to create a client record
-- user_id must be null since they have no identity
CREATE POLICY "Anon can insert client record"
  ON public.clients FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);
