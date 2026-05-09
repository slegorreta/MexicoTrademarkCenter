/*
  # Allow users to upsert their own profile row

  The ApplyPage now calls profiles.upsert() before inserting the client record,
  to handle the case where signup's profile insert was blocked by missing RLS.
  The upsert uses ignoreDuplicates:true so it won't overwrite existing data,
  but Postgres still needs an UPDATE policy to resolve the ON CONFLICT path.
*/

CREATE POLICY "Users can upsert own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = 'client');
