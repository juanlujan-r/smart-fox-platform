/**
 * TWILIO - INITIATE OUTBOUND CALL API
 * POST /api/twilio/initiate-call
 * 
 * Initiates a call via Twilio (server-side)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;

if (!accountSid || !authToken) {
    console.error('⚠️ Twilio credentials not configured');
}

function formatPhoneNumber(phone: string): string {
    if (phone.startsWith('+')) return phone;
    if (phone.match(/^\d{10}$/)) return `+57${phone}`;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    return !cleaned.startsWith('+') ? `+57${cleaned}` : cleaned;
}

export async function POST(request: NextRequest) {
    if (!accountSid || !authToken) {
        return NextResponse.json(
            { error: 'Twilio not configured' },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { toNumber, agentId, recordingEnabled } = body;

        if (!toNumber) {
            return NextResponse.json(
                { error: 'Missing toNumber' },
                { status: 400 }
            );
        }

        const twilioClient = new Twilio(accountSid, authToken);
        const formattedNumber = formatPhoneNumber(toNumber);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Say language="es-ES">Conectando con un agente, por favor espere.</Say>
                <Pause length="1"/>
            </Response>`;

        const call = await twilioClient.calls.create({
            to: formattedNumber,
            from: twilioPhoneNumber || '+1234567890',
            twiml: twiml,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            record: recordingEnabled ? true : false,
            recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording-status`,
        });

        console.log('✅ Outbound call initiated:', call.sid);

        return NextResponse.json({
            success: true,
            callSid: call.sid,
        });
    } catch (error) {
        console.error('❌ Error initiating outbound call:', error);
        return NextResponse.json(
            { error: 'Failed to initiate call', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
