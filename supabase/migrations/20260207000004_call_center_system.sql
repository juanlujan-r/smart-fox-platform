/* ========================================================================
   CALL CENTER SYSTEM - Complete Database Schema
   Date: 2026-02-07
   Description: Call center with CRM, IVR, call records, agent management
   ======================================================================== */

-- ============================================================================
-- 1. CALL CENTER AGENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.call_center_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    extension VARCHAR(10) UNIQUE NOT NULL,
    agent_status VARCHAR(20) DEFAULT 'offline', -- 'available', 'busy', 'break', 'offline'
    max_concurrent_calls INT DEFAULT 1,
    skills JSONB DEFAULT '{"general": true}'::jsonb,
    phone_number VARCHAR(20),
    current_call_count INT DEFAULT 0,
    total_calls_handled INT DEFAULT 0,
    average_handling_time_seconds INT DEFAULT 0,
    last_status_change TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.call_center_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own agent profile" ON public.call_center_agents;
DROP POLICY IF EXISTS "Supervisors view all agents" ON public.call_center_agents;

CREATE POLICY "Users view own agent profile" ON public.call_center_agents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Supervisors view all agents" ON public.call_center_agents
FOR SELECT USING (public.check_is_admin());

CREATE INDEX IF NOT EXISTS idx_agents_status ON public.call_center_agents(agent_status);
CREATE INDEX IF NOT EXISTS idx_agents_user ON public.call_center_agents(user_id);

-- ============================================================================
-- 2. CRM CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    company_name VARCHAR(100),
    company_phone VARCHAR(20),
    contact_type VARCHAR(20), -- 'client', 'prospect', 'lead', 'customer'
    source VARCHAR(50), -- 'inbound_call', 'email', 'referral', etc
    tags JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,
    last_call_date TIMESTAMP,
    last_call_duration_seconds INT,
    total_call_count INT DEFAULT 0,
    call_history_ids UUID[] DEFAULT '{}'::uuid[],
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Agents can insert contacts" ON public.crm_contacts;

CREATE POLICY "Everyone can view contacts" ON public.crm_contacts
FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Agents can insert contacts" ON public.crm_contacts
FOR INSERT WITH CHECK (public.check_is_admin());

CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.crm_contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON public.crm_contacts(contact_type);

-- ============================================================================
-- 3. CALL RECORDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.call_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id VARCHAR(100) UNIQUE NOT NULL, -- Twilio call SID
    agent_id UUID REFERENCES public.call_center_agents(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    caller_number VARCHAR(20) NOT NULL,
    caller_name VARCHAR(100),
    receiver_number VARCHAR(20),
    queue_name VARCHAR(50),
    call_status VARCHAR(20), -- 'queued', 'ringing', 'active', 'completed', 'failed', 'no_answer'
    call_direction VARCHAR(10), -- 'inbound', 'outbound'
    ivr_path JSONB DEFAULT '{}'::jsonb, -- {"menu": "main", "selection": "1"}
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INT DEFAULT 0,
    hold_duration_seconds INT DEFAULT 0,
    transferred BOOLEAN DEFAULT false,
    transferred_to_agent_id UUID REFERENCES public.call_center_agents(id) ON DELETE SET NULL,
    transfer_timestamp TIMESTAMP,
    recording_url TEXT,
    recording_sid VARCHAR(100),
    cost_cents INT, -- in cents
    notes TEXT,
    disposition VARCHAR(50), -- 'completed', 'voicemail', 'callback_requested'
    custom_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents view own calls" ON public.call_records;
DROP POLICY IF EXISTS "Supervisors view all calls" ON public.call_records;

CREATE POLICY "Agents view own calls" ON public.call_records
FOR SELECT USING (
    agent_id = (SELECT id FROM public.call_center_agents WHERE user_id = auth.uid())
);

CREATE POLICY "Supervisors view all calls" ON public.call_records
FOR SELECT USING (public.check_is_admin());

CREATE INDEX IF NOT EXISTS idx_calls_agent ON public.call_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_contact ON public.call_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.call_records(call_status);
CREATE INDEX IF NOT EXISTS idx_calls_direction ON public.call_records(call_direction);
CREATE INDEX IF NOT EXISTS idx_calls_date ON public.call_records(created_at DESC);

-- ============================================================================
-- 4. IVR SCRIPTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ivr_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- "Main IVR", "Sales IVR"
    description TEXT,
    language VARCHAR(10) DEFAULT 'es', -- 'es', 'en'
    welcome_message TEXT,
    script_data JSONB NOT NULL, -- {"menus": [...], "flows": [...]}
    active BOOLEAN DEFAULT true,
    version INT DEFAULT 1,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.ivr_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supervisors manage IVR" ON public.ivr_scripts;

CREATE POLICY "Supervisors manage IVR" ON public.ivr_scripts
FOR ALL USING (public.check_is_admin());

-- ============================================================================
-- 5. CALL QUEUES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.call_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL, -- "Ventas", "Soporte"
    description TEXT,
    agent_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
    routing_strategy VARCHAR(20) DEFAULT 'round_robin', -- 'round_robin', 'least_busy', 'skills_based'
    wait_music_url TEXT,
    max_wait_seconds INT DEFAULT 600,
    priority INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.call_queues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supervisors manage queues" ON public.call_queues;

CREATE POLICY "Supervisors manage queues" ON public.call_queues
FOR ALL USING (public.check_is_admin());

-- ============================================================================
-- 6. VOICEMAIL TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voicemails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.call_queues(id) ON DELETE CASCADE,
    caller_number VARCHAR(20) NOT NULL,
    caller_name VARCHAR(100),
    duration_seconds INT,
    recording_url TEXT,
    recording_sid VARCHAR(100),
    transcription TEXT,
    is_listened BOOLEAN DEFAULT false,
    listened_by_agent_id UUID REFERENCES public.call_center_agents(id) ON DELETE SET NULL,
    listened_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.voicemails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Supervisors view voicemails" ON public.voicemails;

CREATE POLICY "Supervisors view voicemails" ON public.voicemails
FOR ALL USING (public.check_is_admin());

-- ============================================================================
-- 7. CALL CENTER NOTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.call_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_record_id UUID REFERENCES public.call_records(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.call_center_agents(id) ON DELETE SET NULL,
    note_text TEXT NOT NULL,
    note_type VARCHAR(20), -- 'agent_note', 'system', 'callback_reminder'
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents view own notes" ON public.call_notes;
DROP POLICY IF EXISTS "Supervisors view all notes" ON public.call_notes;

CREATE POLICY "Agents view own notes" ON public.call_notes
FOR SELECT USING (agent_id = (SELECT id FROM public.call_center_agents WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors view all notes" ON public.call_notes
FOR ALL USING (public.check_is_admin());

-- ============================================================================
-- 8. CALL CENTER STATISTICS VIEW (for real-time dashboard)
-- ============================================================================

CREATE OR REPLACE VIEW public.call_center_stats AS
SELECT
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'available') as agents_available,
    (SELECT COUNT(*) FROM public.call_center_agents WHERE agent_status = 'busy') as agents_busy,
    (SELECT COUNT(*) FROM public.call_records WHERE call_status = 'active') as calls_active,
    (SELECT COUNT(*) FROM public.call_records WHERE call_status = 'queued') as calls_queued,
    (SELECT AVG(duration_seconds) FROM public.call_records WHERE call_status = 'completed') as avg_call_duration,
    (SELECT COUNT(*) FROM public.crm_contacts) as total_contacts
;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Update agent metrics after call completion
CREATE OR REPLACE FUNCTION public.update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.call_center_agents
    SET 
        total_calls_handled = total_calls_handled + 1,
        last_status_change = NOW()
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_agent_stats ON public.call_records;
CREATE TRIGGER trigger_update_agent_stats
AFTER INSERT ON public.call_records
FOR EACH ROW
WHEN (NEW.call_status = 'completed')
EXECUTE FUNCTION public.update_agent_stats();

-- Update contact last call info
CREATE OR REPLACE FUNCTION public.update_contact_call_info()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.crm_contacts
    SET 
        last_call_date = NEW.created_at,
        last_call_duration_seconds = NEW.duration_seconds,
        total_call_count = total_call_count + 1
    WHERE id = NEW.contact_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contact_call_info ON public.call_records;
CREATE TRIGGER trigger_update_contact_call_info
AFTER INSERT ON public.call_records
FOR EACH ROW
WHEN (NEW.contact_id IS NOT NULL AND NEW.call_status = 'completed')
EXECUTE FUNCTION public.update_contact_call_info();

-- ============================================================================
-- 10. SAMPLE DATA (optional - comment out if not needed)
-- ============================================================================

-- Create default "General" queue
INSERT INTO public.call_queues (name, description, routing_strategy)
VALUES ('General', 'Queue general para todas las llamadas', 'round_robin')
ON CONFLICT (name) DO NOTHING;

-- Create default main IVR script
INSERT INTO public.ivr_scripts (name, description, welcome_message, script_data, language)
VALUES (
    'IVR Principal',
    'Script de IVR básico para recibir llamadas',
    'Bienvenido a Smart Fox Solutions',
    '{"menus": [{"id": "main", "message": "Presione 1 para Ventas, 2 para Soporte, 3 para Recursos Humanos"}]}'::jsonb,
    'es'
)
ON CONFLICT DO NOTHING;

NOTIFY pgrst, 'reload schema';
