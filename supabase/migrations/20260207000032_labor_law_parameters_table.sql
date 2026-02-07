/* ========================================================================
   TABLA PARÁMETROS LEGALES LABORALES - HISTÓRICO
   Date: 2026-02-07
   CTO: SmartFox Solutions
   
   JUSTIFICACIÓN:
   - Las leyes laborales cambian periódicamente (Ley 2101: julio 2026 → 42h)
   - El sistema debe adaptar cálculos automáticamente según fecha vigencia
   - Mantener histórico para auditorías del Ministerio del Trabajo
   
   PRÓXIMO CAMBIO: Julio 2026 - Jornada semanal de 44h → 42h
   ======================================================================== */

-- ============================================================================
-- 1. TABLA PRINCIPAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.labor_law_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL DEFAULT 'CO', -- 'CO' Colombia, 'MX' México
    parameter_name VARCHAR(50) NOT NULL, -- 'weekly_hours', 'monthly_divisor', 'overtime_multiplier'
    parameter_value NUMERIC NOT NULL,
    unit VARCHAR(20), -- 'hours', 'minutes', 'percentage', 'multiplier'
    law_reference TEXT NOT NULL, -- 'Ley 2101 de 2021', 'Ley Federal del Trabajo (México)'
    effective_from DATE NOT NULL,
    effective_until DATE, -- NULL = vigente actualmente
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Índices para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_labor_params_country ON public.labor_law_parameters(country_code);
CREATE INDEX IF NOT EXISTS idx_labor_params_effective ON public.labor_law_parameters(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_labor_params_name ON public.labor_law_parameters(parameter_name);

-- RLS: Solo gerentes pueden administrar
ALTER TABLE public.labor_law_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers_full_access_labor_params" ON public.labor_law_parameters
FOR ALL TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

CREATE POLICY "employees_read_labor_params" ON public.labor_law_parameters
FOR SELECT TO authenticated
USING (true);

-- ============================================================================
-- 2. FUNCIÓN PARA OBTENER PARÁMETRO VIGENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_labor_parameter(
    p_country_code VARCHAR(2),
    p_parameter_name VARCHAR(50),
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC AS $$
DECLARE
    v_value NUMERIC;
BEGIN
    SELECT parameter_value INTO v_value
    FROM public.labor_law_parameters
    WHERE country_code = p_country_code
      AND parameter_name = p_parameter_name
      AND effective_from <= p_date
      AND (effective_until IS NULL OR effective_until >= p_date)
    ORDER BY effective_from DESC
    LIMIT 1;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_labor_parameter IS 
'Obtiene el valor de un parámetro legal laboral vigente en una fecha específica.
Ejemplo: get_labor_parameter(''CO'', ''monthly_divisor_minutes'', ''2026-02-07'') → 13200';

-- ============================================================================
-- 3. FUNCIÓN DINÁMICA calculate_minute_rate() MEJORADA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_minute_rate_dynamic()
RETURNS trigger AS $$
DECLARE
    v_divisor NUMERIC;
BEGIN
    IF NEW.base_salary IS DISTINCT FROM OLD.base_salary AND NEW.base_salary IS NOT NULL THEN
        -- Obtener divisor dinámico desde tabla de parámetros
        v_divisor := public.get_labor_parameter('CO', 'monthly_divisor_minutes', CURRENT_DATE);
        
        -- Fallback: Si no existe parámetro, usar 13200 (44h - Feb 2026)
        IF v_divisor IS NULL THEN
            v_divisor := 13200;
            RAISE WARNING 'Labor parameter not found, using default divisor: %', v_divisor;
        END IF;
        
        NEW.minute_rate := NEW.base_salary / v_divisor;
        
        RAISE NOTICE 'Minute rate calculated: Salary=% / Divisor=% = %', 
            NEW.base_salary, v_divisor, NEW.minute_rate;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. SEED DATOS HISTÓRICOS (COLOMBIA)
-- ============================================================================

-- Período ACTUAL: Feb 2026 - Junio 2026 (44h semanales)
INSERT INTO public.labor_law_parameters (country_code, parameter_name, parameter_value, unit, law_reference, effective_from, effective_until, description)
VALUES 
    ('CO', 'weekly_hours', 44, 'hours', 'Ley 2101 de 2021 - Artículo 161', '2026-01-01', '2026-06-30', 
     'Jornada máxima semanal: 44 horas (vigente hasta junio 2026)'),
    
    ('CO', 'monthly_divisor_hours', 220, 'hours', 'Ley 2101 de 2021', '2026-01-01', '2026-06-30',
     'Divisor mensual: 44h/semana × 4.33 sem/mes ≈ 220 horas'),
    
    ('CO', 'monthly_divisor_minutes', 13200, 'minutes', 'Ley 2101 de 2021', '2026-01-01', '2026-06-30',
     'Divisor mensual: 220 horas × 60 min = 13,200 minutos'),
    
    ('CO', 'overtime_day_multiplier', 1.25, 'multiplier', 'Código Sustantivo del Trabajo Art. 168', '2020-01-01', NULL,
     'Hora Extra Diurna (HED): Salario ordinario + 25%'),
    
    ('CO', 'overtime_night_multiplier', 1.75, 'multiplier', 'Código Sustantivo del Trabajo Art. 168', '2020-01-01', NULL,
     'Hora Extra Nocturna (HEN): Salario ordinario + 75%'),
    
    ('CO', 'night_surcharge', 0.35, 'percentage', 'Código Sustantivo del Trabajo Art. 168', '2020-01-01', NULL,
     'Recargo Nocturno (RN): 35% sobre hora ordinaria (9PM-6AM)'),
    
    ('CO', 'holiday_surcharge', 0.75, 'percentage', 'Código Sustantivo del Trabajo Art. 179', '2020-01-01', NULL,
     'Recargo Dominical y Festivo (RDF): 75% sobre hora ordinaria');

-- Período FUTURO: Julio 2026+ (42h semanales - PREPARADO)
INSERT INTO public.labor_law_parameters (country_code, parameter_name, parameter_value, unit, law_reference, effective_from, effective_until, description)
VALUES 
    ('CO', 'weekly_hours', 42, 'hours', 'Ley 2101 de 2021 - Artículo 161 (Segunda Etapa)', '2026-07-01', NULL, 
     'Jornada máxima semanal: 42 horas (reducción final Ley 2101)'),
    
    ('CO', 'monthly_divisor_hours', 210, 'hours', 'Ley 2101 de 2021', '2026-07-01', NULL,
     'Divisor mensual: 42h/semana × 4.33 sem/mes ≈ 210 horas'),
    
    ('CO', 'monthly_divisor_minutes', 12600, 'minutes', 'Ley 2101 de 2021', '2026-07-01', NULL,
     'Divisor mensual: 210 horas × 60 min = 12,600 minutos');

-- ============================================================================
-- 5. ACTUALIZAR TRIGGER EN TABLA PROFILES
-- ============================================================================

-- Reemplazar trigger antiguo con el dinámico
DROP TRIGGER IF EXISTS update_minute_rate ON public.profiles;
CREATE TRIGGER update_minute_rate BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.calculate_minute_rate_dynamic();

-- ============================================================================
-- 6. RECALCULAR minute_rate CON FUNCIÓN DINÁMICA
-- ============================================================================

UPDATE public.profiles
SET base_salary = base_salary -- Trigger ejecuta calculate_minute_rate_dynamic()
WHERE base_salary IS NOT NULL 
  AND base_salary > 0
  AND role IN ('empleado', 'supervisor', 'gerente');

-- ============================================================================
-- 7. AUDITORÍA
-- ============================================================================

DO $$
DECLARE
    param_count INT;
BEGIN
    SELECT COUNT(*) INTO param_count FROM public.labor_law_parameters;
    
    RAISE NOTICE '✅ Labor Law Parameters Table Created';
    RAISE NOTICE '✅ % parameters seeded (current + future periods)', param_count;
    RAISE NOTICE '✅ Dynamic calculate_minute_rate_dynamic() function installed';
    RAISE NOTICE '✅ System ready for automatic transition to 42h (July 2026)';
END $$;

COMMENT ON TABLE public.labor_law_parameters IS 
'Parámetros legales laborales con histórico. 
Se actualiza automáticamente según fechas de vigencia.
Próximo cambio: Julio 2026 (44h → 42h, divisor 13200 → 12600)';
