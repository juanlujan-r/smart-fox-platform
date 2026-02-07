/* ==========================================================================
   SMART FOX SOLUTIONS - RLS & PAYROLL HARDENING
   Date: 2026-02-07
   Description:
   - Add check_is_manager()
   - Re-emit helper functions with SECURITY DEFINER + search_path
   - Harden RLS policies for profiles, payroll, audits, bonuses
   - Enforce effective_date defaults
   ========================================================================= */

-- 1) Helper functions
CREATE OR REPLACE FUNCTION public.check_is_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'gerente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.calculate_minute_rate()
RETURNS trigger AS $$
BEGIN
  IF NEW.base_salary IS DISTINCT FROM OLD.base_salary AND NEW.base_salary IS NOT NULL THEN
    -- Ley 2101: 42h/semana -> 12600 min/mes
    NEW.minute_rate := ROUND(NEW.base_salary / 12600.0, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'empleado')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) Profiles RLS hardening
DROP POLICY IF EXISTS "Users can update emergency contact" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON public.profiles;

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
  AND supervisor_id = (SELECT supervisor_id FROM public.profiles p WHERE p.id = auth.uid())
  AND manager_id = (SELECT manager_id FROM public.profiles p WHERE p.id = auth.uid())
  AND team_lead_id = (SELECT team_lead_id FROM public.profiles p WHERE p.id = auth.uid())
  AND lob_name = (SELECT lob_name FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Admins update all profiles" ON public.profiles
FOR UPDATE
USING (public.check_is_manager())
WITH CHECK (public.check_is_manager());

-- 3) salary_audit: effective_date + RLS
ALTER TABLE public.salary_audit
  ADD COLUMN IF NOT EXISTS effective_date date;

UPDATE public.salary_audit
SET effective_date = created_at::date
WHERE effective_date IS NULL;

ALTER TABLE public.salary_audit
  ALTER COLUMN effective_date SET DEFAULT CURRENT_DATE;

ALTER TABLE public.salary_audit
  ALTER COLUMN effective_date SET NOT NULL;

DROP POLICY IF EXISTS "salary_audit_read_policy" ON public.salary_audit;
DROP POLICY IF EXISTS "salary_audit_insert_policy" ON public.salary_audit;

CREATE POLICY "salary_audit_read_own" ON public.salary_audit
FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "salary_audit_read_admin" ON public.salary_audit
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "salary_audit_insert_manager" ON public.salary_audit
FOR INSERT WITH CHECK (
  public.check_is_manager()
  AND changed_by_id = auth.uid()
);

-- 4) payroll policies
DROP POLICY IF EXISTS "Managers manage payroll" ON public.payroll_runs;

CREATE POLICY "Managers manage payroll" ON public.payroll_runs
FOR ALL USING (public.check_is_manager())
WITH CHECK (public.check_is_manager());

CREATE POLICY "Management view payroll runs" ON public.payroll_runs
FOR SELECT USING (public.check_is_admin());

DROP POLICY IF EXISTS "Managers manage payroll items" ON public.payroll_items;
DROP POLICY IF EXISTS "Users view own payslips" ON public.payroll_items;

CREATE POLICY "Managers manage payroll items" ON public.payroll_items
FOR ALL USING (public.check_is_manager())
WITH CHECK (public.check_is_manager());

CREATE POLICY "Management view payroll items" ON public.payroll_items
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Users view own payslips" ON public.payroll_items
FOR SELECT USING (auth.uid() = user_id);

-- 5) Bonuses & metrics policies (writes only manager)
DROP POLICY IF EXISTS "performance_bonuses_read_policy" ON public.performance_bonuses;
DROP POLICY IF EXISTS "performance_bonuses_insert_policy" ON public.performance_bonuses;
DROP POLICY IF EXISTS "performance_bonuses_update_policy" ON public.performance_bonuses;

CREATE POLICY "performance_bonuses_read_policy" ON public.performance_bonuses
FOR SELECT USING (auth.uid() = user_id OR public.check_is_admin());

CREATE POLICY "performance_bonuses_insert_policy" ON public.performance_bonuses
FOR INSERT WITH CHECK (public.check_is_manager());

CREATE POLICY "performance_bonuses_update_policy" ON public.performance_bonuses
FOR UPDATE USING (public.check_is_manager())
WITH CHECK (public.check_is_manager());

DROP POLICY IF EXISTS "performance_metrics_read_policy" ON public.performance_metrics;
DROP POLICY IF EXISTS "performance_metrics_insert_policy" ON public.performance_metrics;

CREATE POLICY "performance_metrics_read_policy" ON public.performance_metrics
FOR SELECT USING (auth.uid() = user_id OR public.check_is_admin());

CREATE POLICY "performance_metrics_insert_policy" ON public.performance_metrics
FOR INSERT WITH CHECK (public.check_is_manager());

DROP POLICY IF EXISTS "bonus_audit_read_policy" ON public.bonus_audit;
DROP POLICY IF EXISTS "bonus_audit_insert_policy" ON public.bonus_audit;

CREATE POLICY "bonus_audit_read_policy" ON public.bonus_audit
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "bonus_audit_insert_policy" ON public.bonus_audit
FOR INSERT WITH CHECK (
  public.check_is_manager()
  AND changed_by_id = auth.uid()
);
