/* ==========================================================================
   SMART FOX SOLUTIONS - SECURITY HARDENING
   Date: 2026-02-06
   Description:
   - Prevent role/salary escalation by non-admin users
   - Fix salary_audit FK inconsistency
   ========================================================================== */

-- 1) PROFILES UPDATE POLICIES (prevent role/salary escalation for non-admins)

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

-- Non-admins can update only their own row, but cannot change sensitive fields
CREATE POLICY "Users update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles p WHERE p.id = auth.uid())
  AND base_salary = (SELECT base_salary FROM public.profiles p WHERE p.id = auth.uid())
  AND minute_rate = (SELECT minute_rate FROM public.profiles p WHERE p.id = auth.uid())
  AND contract_type = (SELECT contract_type FROM public.profiles p WHERE p.id = auth.uid())
  AND hiring_date = (SELECT hiring_date FROM public.profiles p WHERE p.id = auth.uid())
);

-- Admins can update any profile fields
CREATE POLICY "Admins update all profiles" ON public.profiles
FOR UPDATE
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- 2) SALARY_AUDIT FK FIX (changed_by_id cannot be NOT NULL with ON DELETE SET NULL)

ALTER TABLE public.salary_audit
  DROP CONSTRAINT IF EXISTS salary_audit_changed_by_id_fkey;

ALTER TABLE public.salary_audit
  ALTER COLUMN changed_by_id DROP NOT NULL;

ALTER TABLE public.salary_audit
  ADD CONSTRAINT salary_audit_changed_by_id_fkey
  FOREIGN KEY (changed_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

