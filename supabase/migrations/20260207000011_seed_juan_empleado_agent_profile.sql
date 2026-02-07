/* ========================================================================
   Seed agent profile for Juan Empleado
   Date: 2026-02-07
   Description: Creates call center agent profile for empleado@smartfox.com
   ======================================================================== */

INSERT INTO public.call_center_agents (
    user_id,
    extension,
    agent_status,
    max_concurrent_calls,
    skills,
    phone_number
)
SELECT
    p.id,
    '1001',
    'offline',
    1,
    '{"general": true}'::jsonb,
    NULLIF(p.personal_data->>'phone', '')
FROM public.profiles p
WHERE (p.personal_data->>'email') = 'empleado@smartfox.com'
AND NOT EXISTS (
    SELECT 1
    FROM public.call_center_agents a
    WHERE a.user_id = p.id
);
