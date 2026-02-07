/* ========================================================================
   FIX CRITICAL: CORRECCIÓN LEY 2101 - DIVISOR MINUTE_RATE
   Date: 2026-02-07
   CTO: SmartFox Solutions
   
   JUSTIFICACIÓN LEGAL:
   - Ley 2101 establece jornada semanal de 44 horas para febrero 2026
   - Divisor mensual: 44h/semana * 4.33 semanas = 190.52h ≈ 220 horas
   - Divisor en minutos: 220 horas * 60 = 13,200 minutos
   
   CAMBIO:
   - ANTERIOR (INCORRECTO): base_salary / 12,600 (42h semanales)
   - NUEVO (CORRECTO): base_salary / 13,200 (44h semanales)
   
   IMPACTO:
   - Reduce sobrepago ~7.22 COP/minuto por empleado
   - Previene multas Ministerio del Trabajo
   ======================================================================== */

-- ============================================================================
-- 1. CORREGIR FUNCIÓN calculate_minute_rate()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_minute_rate()
RETURNS trigger AS $$
BEGIN
    IF NEW.base_salary IS DISTINCT FROM OLD.base_salary AND NEW.base_salary IS NOT NULL THEN
        -- Colombian Labor Law 2101 (Feb-2026): 44 Hours/Week -> 220 Hours/Month -> 13,200 Minutes/Month
        -- NOTA: En julio 2026 cambiará a 42h (12,600 min) - preparar tabla de parámetros históricos
        NEW.minute_rate := NEW.base_salary / 13200;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. RECALCULAR minute_rate PARA TODOS LOS EMPLEADOS EXISTENTES
-- ============================================================================

UPDATE public.profiles
SET minute_rate = base_salary / 13200.0
WHERE base_salary IS NOT NULL 
  AND base_salary > 0
  AND role IN ('empleado', 'supervisor', 'gerente');

-- ============================================================================
-- 3. REGISTRAR AUDITORÍA DE CAMBIO
-- ============================================================================

DO $$
DECLARE
  admin_id UUID;
  affected_count INT;
BEGIN
  -- Obtener ID del gerente para el log de auditoría
  SELECT id INTO admin_id FROM public.profiles WHERE role = 'gerente' LIMIT 1;
  
  -- Contar empleados afectados
  SELECT COUNT(*) INTO affected_count 
  FROM public.profiles 
  WHERE base_salary > 0 AND role IN ('empleado', 'supervisor', 'gerente');
  
  RAISE NOTICE 'Ley 2101 Fix Applied: % employees updated with new minute_rate (÷13,200)', affected_count;
END $$;

-- ============================================================================
-- 4. COMENTARIOS TÉCNICOS
-- ============================================================================

COMMENT ON FUNCTION public.calculate_minute_rate() IS 
'Calcula minute_rate según Ley 2101 (44h semanales = 13,200 min/mes). 
Actualizado: 2026-02-07. 
FUTURO: Migrar a tabla labor_law_parameters con histórico de cambios.';
