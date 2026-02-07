/**
 * TWILIO IVR INPUT HANDLER
 * POST /api/twilio/ivr-input
 * 
 * Procesa las selecciones del usuario en el IVR
 * Enruta a la cola apropiada según la selección
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTwilioRequest } from '@/lib/twilio-security';

export const runtime = 'nodejs';

// Mapping de dígitos a colas
const DIGIT_TO_QUEUE: Record<string, string> = {
    '1': 'sales',
    '2': 'support',
    '3': 'hr',
};

const QUEUE_MESSAGES: Record<string, string> = {
    sales: 'Ha seleccionado la opción de Ventas',
    support: 'Ha seleccionado la opción de Soporte',
    hr: 'Ha seleccionado la opción de Recursos Humanos',
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // SECURITY: Validate Twilio signature
        const isValidTwilioRequest = await validateTwilioRequest(request, formData);
        if (!isValidTwilioRequest) {
            console.error('🔴 SECURITY: Rejected unauthorized ivr-input webhook');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase server credentials for ivr-input webhook.');
            return NextResponse.json(
                { error: 'Server misconfigured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const digits = formData.get('Digits') as string;
        const callSid = formData.get('CallSid') as string;
        const from = formData.get('From') as string;

        console.log('📱 IVR Input received:', { digits, callSid, from });

        // Get queue based on digit
        const queueName = DIGIT_TO_QUEUE[digits];

        if (!queueName) {
            // Invalid selection
            return new NextResponse(
                getTwiMLForInvalidSelection(),
                { headers: { 'Content-Type': 'application/xml' } }
            );
        }

        // Get queue and available agents
        const { data: queue } = await supabase
            .from('call_queues')
            .select('*, agent_ids')
            .eq('name', queueName)
            .single();

        if (!queue || !queue.agent_ids || queue.agent_ids.length === 0) {
            // No queue or agents available
            return new NextResponse(
                getTwiMLForNoAgents(),
                { headers: { 'Content-Type': 'application/xml' } }
            );
        }

        // Get available agents
        const { data: agents } = await supabase
            .from('call_center_agents')
            .select('*')
            .in('id', queue.agent_ids)
            .eq('agent_status', 'available')
            .lt('current_call_count', 'max_concurrent_calls');

        if (!agents || agents.length === 0) {
            // No available agents
            return new NextResponse(
                getTwiMLForVoicemail(),
                { headers: { 'Content-Type': 'application/xml' } }
            );
        }

        // Get first available agent (round-robin would be better)
        const agent = agents[0];
        const phoneNumberToTransfer = agent.phone_number || agent.extension;

        // Update call record
        await supabase
            .from('call_records')
            .insert([
                {
                    call_id: callSid,
                    caller_number: from,
                    call_status: 'ringing',
                    call_direction: 'inbound',
                    queue_name: queueName,
                    agent_id: agent.id,
                    ivr_path: {
                        menu: 'main',
                        selection: digits,
                        queue: queueName,
                    },
                },
            ]);

        // TwiML to transfer call to agent
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say language="es-ES">${QUEUE_MESSAGES[queueName]}. Conectando con un agente.</Say>
                <Dial timeout="30">
                    <Number>${phoneNumberToTransfer}</Number>
                </Dial>
                <Say language="es-ES">El agente no está disponible. Dejando mensaje de voz.</Say>
                <Record timeout="600" transcribe="true" transcribeCallback="/api/twilio/transcription-complete" />
            </Response>`;

        return new NextResponse(twiml, {
            headers: { 'Content-Type': 'application/xml' },
        });
    } catch (error) {
        console.error('Error in ivr-input handler:', error);
        return new NextResponse(
            getTwiMLForError(),
            { headers: { 'Content-Type': 'application/xml' } }
        );
    }
}

function getTwiMLForInvalidSelection(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say language="es-ES">Opción no válida. Intenta de nuevo.</Say>
            <Redirect>/api/twilio/incoming-call</Redirect>
        </Response>`;
}

function getTwiMLForNoAgents(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say language="es-ES">Esa opción no está disponible en este momento.</Say>
            <Say language="es-ES">Por favor intenta más tarde.</Say>
            <Hangup/>
        </Response>`;
}

function getTwiMLForVoicemail(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say language="es-ES">Todos nuestros agentes están ocupados. Deixa tu mensaje después del tono.</Say>
            <Record timeout="600" transcribe="true" transcribeCallback="/api/twilio/transcription-complete" />
            <Say language="es-ES">Tu mensaje ha sido grabado. Gracias.</Say>
            <Hangup/>
        </Response>`;
}

function getTwiMLForError(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say language="es-ES">Disculpa, ocurrió un error. Intenta más tarde.</Say>
            <Hangup/>
        </Response>`;
}
