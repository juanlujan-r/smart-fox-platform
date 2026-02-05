-- Fix infinite recursion in profiles RLS policies by using a SECURITY DEFINER function
-- with row_security disabled, then rely on that function in supervisor/gerente policies.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Profiles: supervisors/gerentes can read all profiles without recursion
DROP POLICY IF EXISTS "Supervisors read all profiles" ON profiles;
CREATE POLICY "Supervisors read all profiles" ON profiles
  FOR SELECT USING (public.get_my_role() IN ('supervisor', 'gerente'));

-- HR requests: supervisors/gerentes can read/update all
DROP POLICY IF EXISTS "Supervisors read all hr_requests" ON hr_requests;
CREATE POLICY "Supervisors read all hr_requests" ON hr_requests
  FOR SELECT USING (public.get_my_role() IN ('supervisor', 'gerente'));

DROP POLICY IF EXISTS "Supervisors update hr_requests" ON hr_requests;
CREATE POLICY "Supervisors update hr_requests" ON hr_requests
  FOR UPDATE USING (public.get_my_role() IN ('supervisor', 'gerente'))
  WITH CHECK (public.get_my_role() IN ('supervisor', 'gerente'));

-- Attendance logs: supervisors/gerentes can read all
DROP POLICY IF EXISTS "Supervisors read all attendance_logs" ON attendance_logs;
CREATE POLICY "Supervisors read all attendance_logs" ON attendance_logs
  FOR SELECT USING (public.get_my_role() IN ('supervisor', 'gerente'));

-- Schedules: supervisors/gerentes can read all
DROP POLICY IF EXISTS "Supervisors read all schedules" ON schedules;
CREATE POLICY "Supervisors read all schedules" ON schedules
  FOR SELECT USING (public.get_my_role() IN ('supervisor', 'gerente'));
