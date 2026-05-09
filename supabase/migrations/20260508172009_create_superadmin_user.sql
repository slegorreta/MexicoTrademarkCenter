/*
  # Create superadmin user

  Creates the initial superadmin account for slegorreta with the provided
  password hash, then inserts the corresponding profile with role 'super_admin'.

  Uses Supabase's internal auth schema to create the user directly so no
  email confirmation is required.
*/

-- Create the auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'slegorreta@mexicotrademarkcenter.com',
  crypt('Irlandes92$', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"slegorreta"}',
  'authenticated',
  'authenticated',
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'slegorreta@mexicotrademarkcenter.com'
);

-- Create the profile with super_admin role
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT
  u.id,
  'slegorreta@mexicotrademarkcenter.com',
  'slegorreta',
  'super_admin',
  true,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'slegorreta@mexicotrademarkcenter.com'
ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin', is_active = true;
