/**
 * TWILIO INCOMING CALL HANDLER
 * POST /api/twilio/incoming-call
 * 
 * Twilio envía las llamadas entrantes aquí
 * Aquí se configura el IVR y enrutamiento
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    // Extract phone number early for rate limiting
    const formData = await request.formData();
    const from = formData.get('From') as string;
    
    // Rate limit: 10 calls per minute per phone number
    const rateLimit = checkRateLimit(`incoming-call:${from}`, 10, 60000);
    if (!rateLimit.allowed) {
        console.warn(`⚠️ Rate limited incoming call from ${from}`);
        return createRateLimitResponse(rateLimit.resetTime, 'Too many calls from this number');
    }
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase server credentials for incoming-call webhook.');
            return NextResponse.json(
                { error: 'Server misconfigured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        
        const to = formData.get('To') as string;
        const callSid = formData.get('CallSid') as string;

        console.log('📥 Incoming call:', { from, to, callSid });

        // Get or create contact in CRM using upsert
        await supabase
            .from('crm_contacts')
            .upsert(
                { phone_number: from, total_call_count: 1, contact_type: 'lead' },
                { onConflict: 'phone_number', ignoreDuplicates: false }
            )
            .select();

        // Get main IVR script
        const { data: ivrScript } = await supabase
            .from('ivr_scripts')
            .select('script_data, welcome_message')
            .eq('name', 'IVR Principal')
            .eq('active', true)
            .single();

        // Build TwiML for incoming call with IVR
        const welcomeMessage = ivrScript?.welcome_message || 'Bienvenido a Smart Fox Solutions';
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Record timeout="0" recordingStatusCallback="/api/twilio/recording-status" />
                <Say language="es-ES">${welcomeMessage}</Say>
                <Gather numDigits="1" timeout="10" method="POST" action="/api/twilio/ivr-input">
                    <Say language="es-ES">Presione 1 para Ventas, 2 para Soporte, 3 para Recursos Humanos</Say>
                </Gather>
                <Say language="es-ES">No recibimos tu entrada. Intentando nuevamente.</Say>
                <Redirect>/api/twilio/incoming-call</Redirect>
            </Response>`;

        return new NextResponse(twiml, {
            headers: { 'Content-Type': 'application/xml' },
        });
    } catch (error) {
        console.error('Error in incoming-call handler:', error);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say language="es-ES">Disculpa, ocurrió un error. Intenta más tarde.</Say>
                <Hangup/>
            </Response>`;

        return new NextResponse(twiml, {
            headers: { 'Content-Type': 'application/xml' },
        });
    }
}
