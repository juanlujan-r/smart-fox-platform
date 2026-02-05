/* ==========================================================================
   SMART FOX SOLUTIONS - RLS AND PERMISSION FIXES
   Date: 2026-02-05
   Purpose: Fix RLS policies and ensure users can manage their own data
   ========================================================================== */

-- ============================================================================
-- 1. FIX PROFILES RLS - Allow users to create and update their own profiles
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

-- Recreate with proper INSERT support
CREATE POLICY "Users view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

CREATE POLICY "Admins update all profiles" ON public.profiles 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

-- ============================================================================
-- 2. FIX HR_REQUESTS RLS - Allow admins to approve/reject requests
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Users view own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Admins manage all requests" ON public.hr_requests;

CREATE POLICY "Users view own requests" ON public.hr_requests 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own requests" ON public.hr_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own requests" ON public.hr_requests 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all requests" ON public.hr_requests 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

CREATE POLICY "Admins update all requests" ON public.hr_requests 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

-- ============================================================================
-- 3. FIX SHIFT_EXCHANGE_REQUESTS RLS - Allow proper access
-- ============================================================================

DROP POLICY IF EXISTS "Users manage own shift requests" ON public.shift_exchange_requests;
DROP POLICY IF EXISTS "Admins manage all shift requests" ON public.shift_exchange_requests;

CREATE POLICY "Users view own shift requests" ON public.shift_exchange_requests 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own shift requests" ON public.shift_exchange_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own shift requests" ON public.shift_exchange_requests 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all shift requests" ON public.shift_exchange_requests 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

CREATE POLICY "Admins update all shift requests" ON public.shift_exchange_requests 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

-- ============================================================================
-- 4. FIX ATTENDANCE_LOGS RLS - Allow users to view their own logs
-- ============================================================================

DROP POLICY IF EXISTS "Users insert own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users view own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins view all logs" ON public.attendance_logs;

CREATE POLICY "Users insert own logs" ON public.attendance_logs 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own logs" ON public.attendance_logs 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view all logs" ON public.attendance_logs 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

-- ============================================================================
-- 5. FIX SCHEDULES RLS - Allow proper role-based access
-- ============================================================================

DROP POLICY IF EXISTS "Users view own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Admins manage all schedules" ON public.schedules;

CREATE POLICY "Users view own schedules" ON public.schedules 
FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

CREATE POLICY "Users insert own schedules" ON public.schedules 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins create schedules" ON public.schedules 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

CREATE POLICY "Admins update all schedules" ON public.schedules 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  )
);

-- ============================================================================
-- 6. ENSURE ALL AUTH USERS HAVE PROFILES (Data sync)
-- ============================================================================

INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'empleado'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Fix any null roles
UPDATE public.profiles SET role = 'empleado' WHERE role IS NULL;

-- ============================================================================
-- END OF FIX
-- ========================================================================== */
