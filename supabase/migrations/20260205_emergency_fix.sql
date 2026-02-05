/* ==========================================================================
   SMART FOX SOLUTIONS - EMERGENCY FIX SCRIPT
   Date: 2026-02-05
   Purpose: Repair database inconsistencies and RLS issues
   ========================================================================== */

-- ============================================================================
-- 1. VERIFY AND FIX PROFILES TABLE STRUCTURE
-- ============================================================================

-- Ensure document_id column exists
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS document_id text;

-- Ensure all required columns exist
ALTER TABLE IF EXISTS public.profiles 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS document_type text DEFAULT 'CC',
ADD COLUMN IF NOT EXISTS hiring_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'Indefinido',
ADD COLUMN IF NOT EXISTS base_salary numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS minute_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS personal_data jsonb DEFAULT '{"phone": "", "address": "", "city": "", "emergency_name": "", "emergency_phone": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS medical_data jsonb DEFAULT '{"eps": "", "arl": "", "blood_type": "", "allergies": "", "pension": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS sizes_data jsonb DEFAULT '{"shirt": "", "pants": "", "shoes": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- ============================================================================
-- 2. REFRESH RLS POLICIES FOR HR_REQUESTS
-- ============================================================================

-- Drop all old policies
DROP POLICY IF EXISTS "Users manage own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Users view own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Users insert own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Users update own requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Admins manage all requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Admins view all requests" ON public.hr_requests;
DROP POLICY IF EXISTS "Admins update all requests" ON public.hr_requests;

-- Recreate clean policies
CREATE POLICY "Users view own requests" ON public.hr_requests 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own requests" ON public.hr_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own requests" ON public.hr_requests 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins view all requests" ON public.hr_requests 
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Admins update all requests" ON public.hr_requests 
FOR UPDATE USING (public.check_is_admin());

-- ============================================================================
-- 3. REFRESH RLS POLICIES FOR PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

CREATE POLICY "Users view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins view all profiles" ON public.profiles 
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Admins update all profiles" ON public.profiles 
FOR UPDATE USING (public.check_is_admin());

-- ============================================================================
-- 4. ENSURE HELPER FUNCTION EXISTS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'gerente')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 5. DATA SYNC - Ensure all Auth users have profiles
-- ============================================================================

INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'empleado'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Fix any null roles
UPDATE public.profiles SET role = 'empleado' WHERE role IS NULL;

-- ============================================================================
-- 6. VERIFY HR_REQUESTS TABLE
-- ============================================================================

-- Ensure hr_requests has all required columns
ALTER TABLE IF EXISTS public.hr_requests
ADD COLUMN IF NOT EXISTS attachment_url text,
ADD COLUMN IF NOT EXISTS details text,
ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- ============================================================================
-- COMPLETION MESSAGE
-- ========================================================================== 

-- If you see this message, the script executed successfully!
-- NEXT STEPS:
-- 1. In your Next.js app, browsers may need to refresh (F5)
-- 2. Try saving profile information again
-- 3. Try approving HR requests again
-- 4. Make sure you can see attachment URLs

-- If issues persist, check Supabase Console for RLS errors
-- ========================================================================== */
