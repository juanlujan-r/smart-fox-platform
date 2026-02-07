/* ========================================================================
   CALL CENTER STATS VIEW
   Date: 2026-02-07
   Description: Creates a materialized view for real-time call center stats
   ======================================================================== */

-- ============================================================================
-- DROP EXISTING VIEW IF EXISTS
-- ============================================================================

DROP VIEW IF EXISTS public.call_center_stats CASCADE;

-- ============================================================================
-- CREATE CALL CENTER STATS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.call_center_stats AS
SELECT
    -- Agent statistics
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'available') AS agents_available,
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'busy') AS agents_busy,
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'break') AS agents_on_break,
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'offline') AS agents_offline,
    (SELECT COUNT(*) FROM public.call_center_agents) AS total_agents,
    
    -- Call statistics
    (SELECT COUNT(*) FROM public.call_records WHERE call_status IN ('active', 'ringing')) AS calls_active,
    (SELECT COUNT(*) FROM public.call_records WHERE call_status = 'queued') AS calls_queued,
    (SELECT COUNT(*) FROM public.call_records WHERE call_status = 'completed' AND DATE(created_at) = CURRENT_DATE) AS calls_completed_today,
    (SELECT COUNT(*) FROM public.call_records WHERE call_status IN ('failed', 'no_answer', 'missed') AND DATE(created_at) = CURRENT_DATE) AS calls_missed_today,
    (SELECT COUNT(*) FROM public.call_records WHERE DATE(created_at) = CURRENT_DATE) AS total_calls_today,
    
    -- Average metrics
    (SELECT COALESCE(AVG(duration_seconds), 0)::INTEGER FROM public.call_records WHERE call_status = 'completed' AND DATE(created_at) = CURRENT_DATE) AS avg_call_duration_today,
    (SELECT COALESCE(AVG(average_handling_time_seconds), 0)::INTEGER FROM public.call_center_agents WHERE total_calls_handled > 0) AS avg_handling_time,
    
    -- CRM statistics
    (SELECT COUNT(*) FROM public.crm_contacts) AS total_contacts,
    (SELECT COUNT(*) FROM public.crm_contacts WHERE DATE(created_at) = CURRENT_DATE) AS new_contacts_today,
    
    -- Queue statistics (if call_queues table exists)
    (SELECT COALESCE(SUM(array_length(agent_ids, 1)), 0)::INTEGER FROM public.call_queues WHERE active = true) AS agents_in_queues,
    
    -- Timestamp
    NOW() AS last_updated;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.call_center_stats TO authenticated;
GRANT SELECT ON public.call_center_stats TO anon;

-- ============================================================================
-- CREATE REFRESH FUNCTION (optional for future materialized view)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.refresh_call_center_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be used to refresh a materialized view in the future
    -- For now, the view is automatically updated
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON VIEW public.call_center_stats IS 'Real-time statistics for call center dashboard';
