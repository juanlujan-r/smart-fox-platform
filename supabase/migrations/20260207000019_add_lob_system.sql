/* ==========================================================================
   SMART FOX SOLUTIONS - LOB (LÍNEA DE NEGOCIOS) SYSTEM
   Date: 2026-02-07
   Description: Add LOB structure with teams (Gerente > Supervisor > Empleados)
   ========================================================================== */

-- 1. Add LOB fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lob_name text,
ADD COLUMN IF NOT EXISTS team_lead_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.profiles(id);

-- 2. Add effective_date to salary_audit
ALTER TABLE public.salary_audit
ADD COLUMN IF NOT EXISTS effective_date date;

-- 3. Update existing salary audits with created_at date
UPDATE public.salary_audit
SET effective_date = created_at::date
WHERE effective_date IS NULL;

-- 4. Create indexes for team hierarchy
CREATE INDEX IF NOT EXISTS idx_profiles_lob ON public.profiles(lob_name);
CREATE INDEX IF NOT EXISTS idx_profiles_team_lead ON public.profiles(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);

-- 5. Add comments
COMMENT ON COLUMN public.profiles.lob_name IS 'Línea de Negocios (LOB1, LOB2, etc.) - Business unit team name';
COMMENT ON COLUMN public.profiles.team_lead_id IS 'Supervisor (Líder de Equipo) responsible for this employee';
COMMENT ON COLUMN public.profiles.manager_id IS 'Gerente (Gerente de Cuenta) responsible for this employee/team';
COMMENT ON COLUMN public.salary_audit.effective_date IS 'Date when the salary change becomes effective';
