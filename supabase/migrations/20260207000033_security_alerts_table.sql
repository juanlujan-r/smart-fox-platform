/* ========================================================================
   TABLA SECURITY ALERTS - MONITOREO DE SEGURIDAD
   Date: 2026-02-07
   CTO: SmartFox Solutions
   
   PROPÓSITO:
   - Registrar todos los intentos de acceso no autorizados
   - Webhooks rechazados, rate limits, actividad sospechosa
   - Dashboard de seguridad para gerentes
   ======================================================================== */

-- ============================================================================
-- 1. TABLA PRINCIPAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL, -- 'webhook_rejected', 'rate_limit_exceeded', 'suspicious_activity'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source VARCHAR(100) NOT NULL, -- 'twilio', 'api', 'login', etc
    endpoint VARCHAR(255) NOT NULL, -- '/api/twilio/incoming-call', '/login', etc
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- Índices para queries rápidos
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON public.security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON public.security_alerts(resolved, created_at DESC);

-- RLS: Solo gerentes pueden ver alertas
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers_read_security_alerts" ON public.security_alerts
FOR SELECT TO authenticated
USING (public.check_is_admin());

CREATE POLICY "system_insert_security_alerts" ON public.security_alerts
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "managers_update_security_alerts" ON public.security_alerts
FOR UPDATE TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 2. VISTA DE ESTADÍSTICAS
-- ============================================================================

CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
    -- Últimas 24 horas
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE created_at >= NOW() - INTERVAL '24 hours') AS alerts_last_24h,
    
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE created_at >= NOW() - INTERVAL '24 hours' 
     AND severity IN ('critical', 'high')) AS critical_alerts_last_24h,
    
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE created_at >= NOW() - INTERVAL '24 hours' 
     AND alert_type = 'webhook_rejected') AS rejected_webhooks_last_24h,
    
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE created_at >= NOW() - INTERVAL '24 hours' 
     AND alert_type = 'rate_limit_exceeded') AS rate_limits_last_24h,
    
    -- Última semana
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE created_at >= NOW() - INTERVAL '7 days') AS alerts_last_week,
    
    -- Sin resolver
    (SELECT COUNT(*) FROM public.security_alerts 
     WHERE resolved = false) AS unresolved_alerts,
    
    -- Top 5 endpoints atacados
    (SELECT json_agg(row_to_json(t)) FROM (
        SELECT endpoint, COUNT(*) AS count
        FROM public.security_alerts
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 5
    ) t) AS top_attacked_endpoints;

-- ============================================================================
-- 3. FUNCIÓN DE LIMPIEZA AUTOMÁTICA
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_security_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar alertas resueltas con más de 90 días
    DELETE FROM public.security_alerts
    WHERE resolved = true
      AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Cleaned up % old security alerts', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 4. COMENTARIOS Y AUDITORÍA
-- ============================================================================

COMMENT ON TABLE public.security_alerts IS 
'Registro de alertas de seguridad: webhooks rechazados, rate limits, intentos de acceso no autorizados.
Retención: 90 días para alertas resueltas, indefinido para no resueltas.';

COMMENT ON VIEW public.security_dashboard IS 
'Dashboard de estadísticas de seguridad para gerentes. Actualizado en tiempo real.';

DO $$
BEGIN
    RAISE NOTICE '✅ Security Alerts System Created';
    RAISE NOTICE '✅ Dashboard view available: security_dashboard';
    RAISE NOTICE '✅ Auto-cleanup function: cleanup_old_security_alerts()';
END $$;
