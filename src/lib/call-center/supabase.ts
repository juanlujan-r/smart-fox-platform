/**
 * CALL CENTER SUPABASE SERVICE
 * Maneja las operaciones de base de datos para el call center
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// ============================================================================
// TIPOS
// ============================================================================

export interface AgentProfile {
    id: string;
    user_id: string;
    extension: string;
    agent_status: 'available' | 'busy' | 'break' | 'offline';
    max_concurrent_calls: number;
    skills: Record<string, boolean>;
    phone_number?: string;
    current_call_count: number;
    total_calls_handled: number;
    average_handling_time_seconds: number;
}

export interface CallRecord {
    id: string;
    call_id: string;
    agent_id?: string;
    contact_id?: string;
    caller_number: string;
    caller_name?: string;
    call_status: string;
    call_direction: 'inbound' | 'outbound';
    started_at?: string;
    ended_at?: string;
    duration_seconds: number;
    recording_url?: string;
    notes?: string;
    created_at: string;
}

export interface CRMContact {
    id: string;
    phone_number: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    contact_type: 'client' | 'prospect' | 'lead' | 'customer';
    tags: string[];
    notes?: string;
    total_call_count: number;
    last_call_date?: string;
    created_at: string;
}

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

/**
 * Obtiene el perfil de agente del usuario autenticado
 */
export async function getAgentProfile(): Promise<AgentProfile | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('call_center_agents')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error fetching agent profile:', error);
            return null;
        }

        return data as AgentProfile;
    } catch (error) {
        console.error('Error in getAgentProfile:', error);
        return null;
    }
}

/**
 * Crea un perfil de agente para un usuario
 */
export async function createAgentProfile(userId: string, extension: string, skills: Record<string, boolean> = {}) {
    try {
        const { data, error } = await supabase
            .from('call_center_agents')
            .insert([
                {
                    user_id: userId,
                    extension,
                    skills: { general: true, ...skills },
                    agent_status: 'offline',
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating agent profile:', error);
        throw error;
    }
}

/**
 * Actualiza el estado del agente
 */
export async function updateAgentStatus(agentId: string, status: string) {
    try {
        const { data, error } = await supabase
            .from('call_center_agents')
            .update({
                agent_status: status,
                last_status_change: new Date().toISOString(),
            })
            .eq('id', agentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating agent status:', error);
        throw error;
    }
}

/**
 * Obtiene lista de agentes disponibles
 */
export async function getAvailableAgents() {
    try {
        const { data, error } = await supabase
            .from('call_center_agents')
            .select('*')
            .eq('agent_status', 'available')
            .lt('current_call_count', 'max_concurrent_calls');

        if (error) throw error;
        return data as AgentProfile[];
    } catch (error) {
        console.error('Error getting available agents:', error);
        return [];
    }
}

// ============================================================================
// CALL RECORD OPERATIONS
// ============================================================================

/**
 * Registra una nueva llamada
 */
export async function createCallRecord(callData: Partial<CallRecord>) {
    try {
        const { data, error } = await supabase
            .from('call_records')
            .insert([callData])
            .select()
            .single();

        if (error) throw error;
        return data as CallRecord;
    } catch (error) {
        console.error('Error creating call record:', error);
        throw error;
    }
}

/**
 * Actualiza un registro de llamada
 */
export async function updateCallRecord(callId: string, updates: Partial<CallRecord>) {
    try {
        const { data, error } = await supabase
            .from('call_records')
            .update(updates)
            .eq('call_id', callId)
            .select()
            .single();

        if (error) throw error;
        return data as CallRecord;
    } catch (error) {
        console.error('Error updating call record:', error);
        throw error;
    }
}

/**
 * Obtiene el historial de llamadas de un agente
 */
export async function getAgentCallHistory(agentId: string, limit: number = 50) {
    try {
        const { data, error } = await supabase
            .from('call_records')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as CallRecord[];
    } catch (error) {
        console.error('Error getting call history:', error);
        return [];
    }
}

/**
 * Obtiene historial de llamadas de un contacto
 */
export async function getContactCallHistory(contactId: string) {
    try {
        const { data, error } = await supabase
            .from('call_records')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as CallRecord[];
    } catch (error) {
        console.error('Error getting contact call history:', error);
        return [];
    }
}

/**
 * Obtiene estadísticas del call center
 */
export async function getCallCenterStats() {
    try {
        const { data, error } = await supabase
            .from('call_center_stats')
            .select('*')
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting call center stats:', error);
        return null;
    }
}

// ============================================================================
// CRM CONTACT OPERATIONS
// ============================================================================

/**
 * Obtiene o crea un contacto por número de teléfono
 */
export async function getOrCreateContact(phoneNumber: string, contactData?: Partial<CRMContact>) {
    try {
        // Intenta obtener el contacto existente
        let { data: existingContact, error: fetchError } = await supabase
            .from('crm_contacts')
            .select('*')
            .eq('phone_number', phoneNumber)
            .single();

        if (!fetchError && existingContact) {
            return existingContact as CRMContact;
        }

        // Si no existe, lo crea
        const { data: newContact, error: createError } = await supabase
            .from('crm_contacts')
            .insert([
                {
                    phone_number: phoneNumber,
                    contact_type: 'lead',
                    tags: [],
                    ...contactData,
                }
            ])
            .select()
            .single();

        if (createError) throw createError;
        return newContact as CRMContact;
    } catch (error) {
        console.error('Error in getOrCreateContact:', error);
        throw error;
    }
}

/**
 * Actualiza un contacto CRM
 */
export async function updateContact(contactId: string, updates: Partial<CRMContact>) {
    try {
        const { data, error } = await supabase
            .from('crm_contacts')
            .update(updates)
            .eq('id', contactId)
            .select()
            .single();

        if (error) throw error;
        return data as CRMContact;
    } catch (error) {
        console.error('Error updating contact:', error);
        throw error;
    }
}

/**
 * Obtiene lista de contactos con filtros
 */
export async function searchContacts(query: string, contactType?: string) {
    try {
        let q = supabase
            .from('crm_contacts')
            .select('*')
            .or(`phone_number.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

        if (contactType) {
            q = q.eq('contact_type', contactType);
        }

        const { data, error } = await q.limit(20);

        if (error) throw error;
        return data as CRMContact[];
    } catch (error) {
        console.error('Error searching contacts:', error);
        return [];
    }
}

// ============================================================================
// CALL NOTES
// ============================================================================

/**
 * Añade una nota a una llamada
 */
export async function addCallNote(callRecordId: string, noteText: string, agentId?: string) {
    try {
        const { data, error } = await supabase
            .from('call_notes')
            .insert([
                {
                    call_record_id: callRecordId,
                    agent_id: agentId,
                    note_text: noteText,
                    note_type: 'agent_note',
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error adding call note:', error);
        throw error;
    }
}

/**
 * Obtiene notas de una llamada
 */
export async function getCallNotes(callRecordId: string) {
    try {
        const { data, error } = await supabase
            .from('call_notes')
            .select('*')
            .eq('call_record_id', callRecordId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error getting call notes:', error);
        return [];
    }
}

export { supabase };
export default supabase;
