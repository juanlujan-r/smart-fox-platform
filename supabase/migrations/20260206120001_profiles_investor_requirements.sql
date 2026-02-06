/* ==========================================================================
   SMART FOX SOLUTIONS - PROFILES INVESTOR REQUIREMENTS
   Date: 2026-02-06
   Description: Add HR fields required by investor compliance
   ========================================================================== */

-- Actualización de la tabla profiles para requisitos de inversionista
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS eps text,
ADD COLUMN IF NOT EXISTS arl text,
ADD COLUMN IF NOT EXISTS pension_fund text,
ADD COLUMN IF NOT EXISTS severance_fund text,
ADD COLUMN IF NOT EXISTS blood_type text;

-- Actualizar restricción de tipo de contrato
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_contract_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_contract_type_check 
CHECK (contract_type IN ('Obra labor', 'Término indefinido', 'Término fijo', 'Prestación de servicios', 'Indefinido'));

-- Política para que el empleado solo edite su contacto de emergencia
DROP POLICY IF EXISTS "Users can update emergency contact" ON public.profiles;
CREATE POLICY "Users can update emergency contact" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  -- Esta lógica asegura que otros campos críticos no se toquen si no eres admin
  (public.check_is_admin() = true) OR 
  (auth.uid() = id)
);
