/**
 * QUICK START - Call Center Setup
 * 
 * Este archivo contiene comandos SQL para inicializar el call center
 * Ejecutar en Supabase SQL Editor o como migración
 */

-- ============================================================================
-- 1. CREAR PERFIL DE AGENTE PARA UN USUARIO
-- ============================================================================

-- Primero, obtener el ID de un usuario existente en profiles
-- (Usa un usuario test que ya existe)

-- Insertar agente para Carlos (gerente/supervisor) - Extension 1001
INSERT INTO public.call_center_agents 
  (user_id, extension, agent_status, skills, phone_number)
SELECT 
  id,
  '1001',
  'offline',
  '{"general": true, "sales": true, "support": true}'::jsonb,
  NULL
FROM auth.users
WHERE email = 'carlos@smartfoxplatform.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insertar agente para José (supervisor) - Extension 1002
INSERT INTO public.call_center_agents 
  (user_id, extension, agent_status, skills, phone_number)
SELECT 
  id,
  '1002',
  'offline',
  '{"general": true, "sales": false, "support": true}'::jsonb,
  NULL
FROM auth.users
WHERE email = 'jose@smartfoxplatform.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 2. CREAR COLAS DE LLAMADAS
-- ============================================================================

-- Cola de Ventas
INSERT INTO public.call_queues 
  (name, description, routing_strategy, active)
VALUES 
  ('sales', 'Cola de Ventas', 'round_robin', true)
ON CONFLICT (name) DO NOTHING;

-- Cola de Soporte
INSERT INTO public.call_queues 
  (name, description, routing_strategy, active)
VALUES 
  ('support', 'Cola de Soporte Técnico', 'round_robin', true)
ON CONFLICT (name) DO NOTHING;

-- Cola de Recursos Humanos
INSERT INTO public.call_queues 
  (name, description, routing_strategy, active)
VALUES 
  ('hr', 'Cola de Recursos Humanos', 'round_robin', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ACTUALIZAR COLAS CON AGENTES
-- ============================================================================

-- Asignar agentes a la cola de Soporte
UPDATE public.call_queues
SET agent_ids = ARRAY(
  SELECT id FROM public.call_center_agents 
  WHERE extension IN ('1001', '1002')
)
WHERE name = 'support';

-- Asignar agentes a la cola de Ventas  
UPDATE public.call_queues
SET agent_ids = ARRAY(
  SELECT id FROM public.call_center_agents 
  WHERE extension = '1001'
)
WHERE name = 'sales';

-- ============================================================================
-- 4. VERIFICAR QUE TODO ESTÁ LISTO
-- ============================================================================

-- Ver agentes creados
SELECT id, extension, agent_status, skills 
FROM public.call_center_agents;

-- Ver colas
SELECT id, name, agent_ids, active 
FROM public.call_queues;

-- Ver scripts IVR
SELECT id, name, active, language 
FROM public.ivr_scripts;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*

DESPUÉS de ejecutar esto:

1. Ir a la página /call-center en la app
2. Cambiar estado de agente a "Disponible" 
3. El hook useCallCenter cargará automáticamente el perfil

4. Para PROBAR llamadas salientes:
   - Escribe un número en AgentPanel
   - Presiona "Llamar" (se marcará con Twilio)

5. Para PROBAR IVR:
   - Marca el número de Twilio desde un teléfono real
   - Sigue el IVR (Presiona 1, 2 o 3)
   - Se enrutará a un agente o voicemail

6. Para VER GRABACIONES:
   - Ve al Dashboard
   - Busca la llamada en el historial
   - Haz clic en "🔊 Escuchar"

*/
