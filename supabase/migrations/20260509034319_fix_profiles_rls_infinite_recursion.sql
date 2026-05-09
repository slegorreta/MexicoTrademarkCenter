/*
  # Fix infinite recursion in profiles RLS policies

  ## Problem
  The RLS policies on `profiles` (Admins can read all profiles, Super admins can
  insert/update profiles) reference the `profiles` table in their USING/WITH CHECK
  expressions. When Postgres evaluates those policies it triggers another RLS check
  on `profiles`, which triggers the same policies again → infinite recursion → 500.

  ## Fix
  1. Create a SECURITY DEFINER helper function `get_my_claim(claim text)` that reads
     the current user's role from `profiles` without going through RLS (because the
     function runs as its owner, not the calling role).
  2. Drop and recreate the offending policies to use this function instead.

  The two non-recursive policies (Users can read own profile, Users can update own
  profile) are untouched because they only reference `auth.uid() = id`.
*/

-- Step 1: helper function – reads caller's own profile bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Only service_role / postgres should call this directly; expose via policies only
REVOKE EXECUTE ON FUNCTION public.get_my_profile_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_my_profile_role() FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_my_profile_role() TO authenticated;

-- Step 2: drop the recursion-causing policies on profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;

-- Step 3: recreate them using the helper (no self-referencing subquery)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
  );

CREATE POLICY "Super admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_profile_role() = 'super_admin'
  );

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin'])
  )
  WITH CHECK (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin'])
  );

-- Step 4: also fix the same recursion pattern on the clients table
-- (Staff policies check FROM profiles, which triggers profiles RLS → same 500)
DROP POLICY IF EXISTS "Staff can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
DROP POLICY IF EXISTS "Staff can view all clients" ON public.clients;

CREATE POLICY "Staff can insert clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can update clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  )
  WITH CHECK (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','filing_staff'])
  );

CREATE POLICY "Staff can view all clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (
    get_my_profile_role() = ANY (ARRAY['super_admin','admin','docketing_staff','filing_staff','read_only'])
  );
