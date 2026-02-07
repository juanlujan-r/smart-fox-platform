/**
 * TWILIO - TRANSFER CALL API
 * POST /api/twilio/transfer-call
 * 
 * Transfers a call to another number via Twilio (server-side)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

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
        const { callSid, transferToNumber } = body;

        if (!callSid || !transferToNumber) {
            return NextResponse.json(
                { error: 'Missing callSid or transferToNumber' },
                { status: 400 }
            );
        }

        const twilioClient = new Twilio(accountSid, authToken);
        const formattedNumber = formatPhoneNumber(transferToNumber);

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Dial>
                    <Number>${formattedNumber}</Number>
                </Dial>
            </Response>`;

        await twilioClient.calls(callSid).update({
            twiml: twiml,
        });

        console.log('✅ Call transferred from', callSid, 'to', formattedNumber);

        return NextResponse.json({
            success: true,
            callSid: callSid,
            transferredTo: formattedNumber,
        });
    } catch (error) {
        console.error('❌ Error transferring call:', error);
        return NextResponse.json(
            { error: 'Failed to transfer call', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
