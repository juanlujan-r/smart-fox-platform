/**
 * TWILIO RECORDING STATUS WEBHOOK
 * POST /api/twilio/recording-status
 * 
 * Twilio notifica cuando una grabación está lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('Missing Supabase server credentials for recording-status webhook.');
            return NextResponse.json(
                { error: 'Server misconfigured' },
                { status: 500 }
            );
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const formData = await request.formData();

        const recordingSid = formData.get('RecordingSid') as string;
        const recordingUrl = formData.get('RecordingUrl') as string;
        const callSid = formData.get('CallSid') as string;
        const recordingStatus = formData.get('RecordingStatus') as string;

        console.log('🎙️ Recording ready:', { recordingSid, recordingUrl, recordingStatus });

        // Update call record with recording URL
        if (recordingStatus === 'completed' && callSid) {
            const { error } = await supabase
                .from('call_records')
                .update({
                    recording_url: recordingUrl,
                    recording_sid: recordingSid,
                })
                .eq('call_id', callSid);

            if (error) {
                console.error('Error updating recording:', error);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in recording-status webhook:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
