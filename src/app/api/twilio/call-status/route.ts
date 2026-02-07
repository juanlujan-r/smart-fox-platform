/**
 * TWILIO CALL STATUS WEBHOOK
 * POST /api/twilio/call-status
 * 
 * Twilio envía actualizaciones de estado de llamadas aquí
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTwilioRequest } from '@/lib/twilio-security';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        
        // SECURITY: Validate Twilio signature
        const isValidTwilioRequest = await validateTwilioRequest(request, formData);
        if (!isValidTwilioRequest) {
            console.error('🔴 SECURITY: Rejected unauthorized call-status webhook');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase server credentials for call-status webhook.');
            return NextResponse.json(
                { error: 'Server misconfigured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const callSid = formData.get('CallSid') as string;
        const callStatus = formData.get('CallStatus') as string;
        const duration = formData.get('CallDuration') as string;
        const recordingUrl = formData.get('RecordingUrl') as string;
        const from = formData.get('From') as string;
        const to = formData.get('To') as string;

        console.log('📞 Call status update:', { callSid, callStatus, duration, from, to });

        // Update call record in database
        const { error } = await supabase
            .from('call_records')
            .update({
                call_status: callStatus,
                duration_seconds: duration ? parseInt(duration) : 0,
                recording_url: recordingUrl,
            })
            .eq('call_id', callSid);

        if (error) {
            console.error('Error updating call record:', error);
        }

        // Return TwiML response
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say language="es-ES">Gracias por usar nuestros servicios. Adiós.</Say>
            </Response>`;

        return new NextResponse(twiml, {
            headers: { 'Content-Type': 'application/xml' },
        });
    } catch (error) {
        console.error('Error in call-status webhook:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
