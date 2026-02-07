/**
 * TWILIO - HANGUP CALL API
 * POST /api/twilio/hangup-call
 * 
 * Terminates a call via Twilio (server-side)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    console.error('⚠️ Twilio credentials not configured');
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
        const { callSid } = body;

        if (!callSid) {
            return NextResponse.json(
                { error: 'Missing callSid' },
                { status: 400 }
            );
        }

        const twilioClient = new Twilio(accountSid, authToken);

        await twilioClient.calls(callSid).update({ status: 'completed' });

        console.log('✅ Call ended:', callSid);

        return NextResponse.json({
            success: true,
            callSid: callSid,
        });
    } catch (error) {
        console.error('❌ Error ending call:', error);
        return NextResponse.json(
            { error: 'Failed to end call', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
