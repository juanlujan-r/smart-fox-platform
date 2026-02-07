/**
 * CUSTOM HOOKS FOR CALL CENTER
 * useCallCenter - Main hook for managing calls and agent state
 * 
 * NOTA: Este hook llama a API endpoints (no usa Twilio SDK directamente)
 * Los SDK de servidor se usan en src/app/api/twilio/
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    AgentProfile,
    CallRecord,
    CRMContact,
    getAgentProfile,
    updateAgentStatus as updateAgentStatusDB,
    createCallRecord,
    updateCallRecord,
    getOrCreateContact,
    getContactCallHistory,
    updateContact as updateContactDB,
    addCallNote,
} from '@/lib/call-center/supabase';
import { supabase } from '@/lib/call-center/supabase';

// Simple phone formatting (doesn't need Twilio SDK)
function formatPhoneNumber(phone: string): string {
    // Si ya está en formato +, devuelve tal cual
    if (phone.startsWith('+')) return phone;
    
    // Si es de Colombia (10 dígitos), agrega +57
    if (phone.match(/^\d{10}$/)) {
        return `+57${phone}`;
    }
    
    // Si es formato con guiones/espacios, limpia
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (!cleaned.startsWith('+')) {
        return `+57${cleaned}`;
    }
    
    return cleaned;
}

export interface UseCallCenterReturn {
    // Agent
    agentProfile: AgentProfile | null;
    agentStatus: string;
    updateAgentStatus: (status: string) => Promise<void>;
    
    // Calls
    currentCall: CallRecord | null;
    callHistory: CallRecord[];
    isCallActive: boolean;
    startCall: (phoneNumber: string) => Promise<void>;
    endCall: (notes?: string) => Promise<void>;
    transferCall: (toNumber: string) => Promise<void>;
    
    // CRM
    currentContact: CRMContact | null;
    contactHistory: CallRecord[];
    loadContact: (phoneNumber: string) => Promise<void>;
    updateContact: (updates: Partial<CRMContact>) => Promise<void>;
    
    // UI State
    loading: boolean;
    error: string | null;
    success: string | null;
}

export function useCallCenter(): UseCallCenterReturn {
    // Agent state
    const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
    const [agentStatus, setAgentStatus] = useState<string>('offline');

    // Call state
    const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
    const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
    const [isCallActive, setIsCallActive] = useState(false);

    // CRM state
    const [currentContact, setCurrentContact] = useState<CRMContact | null>(null);
    const [contactHistory, setContactHistory] = useState<CallRecord[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Refs
    const callTimerRef = useRef<NodeJS.Timeout>();
    const callStartTimeRef = useRef<Date>();

    // Initialize agent
    useEffect(() => {
        loadAgentProfile();
    }, []);

    // Setup real-time listeners
    useEffect(() => {
        if (!agentProfile) return;

        const subscription = supabase
            .from(`call_records:agent_id=eq.${agentProfile.id}`)
            .on('*', (payload) => {
                console.log('Call update:', payload);
                if (payload.new) {
                    setCurrentCall(payload.new as CallRecord);
                }
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [agentProfile?.id]);

    const loadAgentProfile = async () => {
        try {
            const profile = await getAgentProfile();
            setAgentProfile(profile);
            if (profile) {
                setAgentStatus(profile.agent_status);
            }
        } catch (err) {
            setError('Failed to load agent profile');
            console.error(err);
        }
    };

    const updateAgentStatus = useCallback(async (status: string) => {
        if (!agentProfile) return;

        try {
            setLoading(true);
            await updateAgentStatusDB(agentProfile.id, status);
            setAgentStatus(status);
            setSuccess(`Status updated to ${status}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update status');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [agentProfile]);

    const startCall = useCallback(async (phoneNumber: string) => {
        if (!agentProfile) {
            setError('Agent profile not loaded');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Format phone number
            const formattedNumber = formatPhoneNumber(phoneNumber);

            // Create call record in DB
            const callrecord = await createCallRecord({
                call_id: `pending-${Date.now()}`, // Will be updated with Twilio SID
                agent_id: agentProfile.id,
                caller_number: formattedNumber,
                call_status: 'queued',
                call_direction: 'outbound',
                duration_seconds: 0,
            });

            // Update status to busy
            await updateAgentStatus('busy');

            // Initiate call with API (server handles Twilio)
            const response = await fetch('/api/twilio/initiate-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toNumber: phoneNumber,
                    agentId: agentProfile.id,
                    recordingEnabled: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to initiate call');
            }

            const { callSid } = await response.json();

            // Update call record with Twilio SID
            await updateCallRecord(callrecord.call_id, {
                call_id: callSid,
                call_status: 'ringing',
                started_at: new Date().toISOString(),
            });

            setCurrentCall(callrecord);
            setIsCallActive(true);
            callStartTimeRef.current = new Date();
            setSuccess('Call initiated');

            // Load contact info
            await loadContact(phoneNumber);
        } catch (err) {
            setError(`Failed to start call: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
            await updateAgentStatus('available');
        } finally {
            setLoading(false);
        }
    }, [agentProfile, updateAgentStatus]);

    const endCall = useCallback(async (notes?: string) => {
        if (!currentCall) return;

        try {
            setLoading(true);

            // Calculate duration
            const duration = callStartTimeRef.current
                ? Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000)
                : 0;

            // Update call record
            await updateCallRecord(currentCall.call_id, {
                call_status: 'completed',
                ended_at: new Date().toISOString(),
                duration_seconds: duration,
                notes: notes,
            });

            // Save call notes if provided
            if (notes && notes.trim() && agentProfile) {
                try {
                    await addCallNote(currentCall.id, notes, agentProfile.id);
                } catch (noteError) {
                    console.warn('Failed to save call note:', noteError);
                }
            }

            // Hang up with API (server handles Twilio)
            try {
                await fetch('/api/twilio/hangup-call', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callSid: currentCall.call_id }),
                });
            } catch (e) {
                console.warn('Hangup warning:', e);
            }

            // Update agent status
            await updateAgentStatus('available');

            setCurrentCall(null);
            setIsCallActive(false);
            callStartTimeRef.current = undefined;
            setSuccess('Call ended');
        } catch (err) {
            setError('Failed to end call');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentCall, updateAgentStatus, agentProfile]);

    const transferCall = useCallback(async (toNumber: string) => {
        if (!currentCall) return;

        try {
            setLoading(true);

            // Transfer with API (server handles Twilio)
            const response = await fetch('/api/twilio/transfer-call', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    callSid: currentCall.call_id,
                    transferToNumber: toNumber,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to transfer call');
            }

            // Update call record
            await updateCallRecord(currentCall.call_id, {
                transferred: true,
                transfer_timestamp: new Date().toISOString(),
            });

            setSuccess('Call transferred');
        } catch (err) {
            setError('Failed to transfer call');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentCall]);

    const loadContact = useCallback(async (phoneNumber: string) => {
        try {
            const contact = await getOrCreateContact(phoneNumber);
            setCurrentContact(contact);

            // Load contact call history
            const history = await getContactCallHistory(contact.id);
            setContactHistory(history);
        } catch (err) {
            console.error('Error loading contact:', err);
        }
    }, []);

    const updateContact = useCallback(async (updates: Partial<CRMContact>) => {
        if (!currentContact) return;

        try {
            const updated = await updateContactDB(currentContact.id, updates);
            setCurrentContact(updated);
            setSuccess('Contact updated');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update contact');
            console.error(err);
        }
    }, [currentContact]);

    return {
        agentProfile,
        agentStatus,
        updateAgentStatus,
        currentCall,
        callHistory,
        isCallActive,
        startCall,
        endCall,
        transferCall,
        currentContact,
        contactHistory,
        loadContact,
        updateContact,
        loading,
        error,
        success,
    };
}

export default useCallCenter;
