/* ========================================================================
   Seed agent profile for empleado@smartfox.com
   Date: 2026-02-07
   Description: Ensures the employee account has a call center agent profile
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
    u.id,
    RIGHT(REPLACE(u.id::text, '-', ''), 4),
    'offline',
    1,
    '{"general": true}'::jsonb,
    NULLIF(p.personal_data->>'phone', '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE LOWER(u.email) = 'empleado@smartfox.com'
AND NOT EXISTS (
    SELECT 1
    FROM public.call_center_agents a
    WHERE a.user_id = u.id
);
