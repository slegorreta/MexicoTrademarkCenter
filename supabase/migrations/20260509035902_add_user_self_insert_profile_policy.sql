/*
  # Add policy allowing users to insert their own profile on signup

  The signUp flow calls supabase.from('profiles').insert({ id: data.user.id, ... })
  immediately after auth.signUp(). Without an INSERT policy for regular users,
  this silently fails. The missing profile row then causes the clients FK
  (user_id → profiles.id) to reject with a 409 on every filing attempt.

  This policy allows a user to insert exactly one profile row where the id
  matches their own auth.uid(), preventing any privilege escalation.
*/

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
