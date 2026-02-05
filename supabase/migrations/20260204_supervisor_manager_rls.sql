-- Allow supervisors and gerentes to read/update data for Gestión de Equipo
-- CRITICAL: Use inline subqueries instead of calling get_my_role() in policy conditions
-- This avoids infinite recursion when checking roles on the profiles table itself
-- The SECURITY DEFINER function is kept for applications that may use it directly


CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Allow direct auth checks on own profile without recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Supervisors/gerentes can read all profiles (for Live Board names)
DROP POLICY IF EXISTS "Supervisors read all profiles" ON profiles;
CREATE POLICY "Supervisors read all profiles" ON profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  );

-- Supervisors/gerentes can read all hr_requests and update status (Request Manager)
DROP POLICY IF EXISTS "Supervisors read all hr_requests" ON hr_requests;
CREATE POLICY "Supervisors read all hr_requests" ON hr_requests
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  );

DROP POLICY IF EXISTS "Supervisors update hr_requests" ON hr_requests;
CREATE POLICY "Supervisors update hr_requests" ON hr_requests
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  );


-- Supervisors/gerentes can read all attendance_logs (Live Board)
-- Note: if attendance_logs RLS doesn't exist yet, enable it and add own-read first
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supervisors read all attendance_logs" ON attendance_logs;
CREATE POLICY "Supervisors read all attendance_logs" ON attendance_logs
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  );

-- Allow users to read own attendance_logs if not already present
DROP POLICY IF EXISTS "Users read own attendance_logs" ON attendance_logs;
CREATE POLICY "Users read own attendance_logs" ON attendance_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Supervisors/gerentes can read all schedules (Absence Alert)
DROP POLICY IF EXISTS "Supervisors read all schedules" ON schedules;
CREATE POLICY "Supervisors read all schedules" ON schedules
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('supervisor', 'gerente')
  );

