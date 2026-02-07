/**
 * TWILIO INTEGRATION SERVICE
 * Maneja todas las operaciones de Twilio para el sistema call center
 * 
 * NOTA: Este archivo solo se usa en API routes (servidor)
 * No importar en componentes cliente
 * 
 * SETUP REQUERIDO:
 * 1. Crear cuenta en Twilio (https://www.twilio.com)
 * 2. Obtener: Account SID, Auth Token, Twilio Phone Number
 * 3. Crear .env.local con:
 *    TWILIO_ACCOUNT_SID=xxxxx
 *    TWILIO_AUTH_TOKEN=xxxxx
 *    NEXT_PUBLIC_TWILIO_PHONE_NUMBER=+xxxxx
 * 4. Configurar webhooks en Twilio Console
 */

import { Twilio } from 'twilio';

const accountSid = process.env.NEXT_PUBLIC_TWILIO_ACCOUNT_SID || '';
const authToken = process.env.NEXT_PUBLIC_TWILIO_AUTH_TOKEN || '';
const twilioPhoneNumber = process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '';

if (!accountSid || !authToken) {
    console.warn('⚠️ Twilio credentials not configured. Call center functions will be limited.');
}

export const twilioClient = accountSid && authToken 
    ? new Twilio(accountSid, authToken)
    : null;

// ============================================================================
// TIPOS
// ============================================================================

export interface CallInitParams {
    toNumber: string;
    fromNumber?: string;
    agentId: string;
    contactId?: string;
    recordingEnabled?: boolean;
}

export interface CallTransferParams {
    callSid: string;
    transferToNumber: string;
}

export interface IVRMenuOption {
    digit: string;
    description: string;
    actionQueue?: string;
    actionTransfer?: string;
}

export interface IVRMenu {
    prompt: string;
    options: IVRMenuOption[];
    maxAttempts?: number;
    timeout?: number;
}

// ============================================================================
// LLAMADAS SALIENTES
// ============================================================================

/**
 * Inicia una llamada saliente a un contacto
 * @param params Parámetros de la llamada
 * @returns Call SID de Twilio
 */
export async function initiateOutboundCall(params: CallInitParams): Promise<string> {
    if (!twilioClient) {
        throw new Error('Twilio not configured. Missing credentials.');
    }

    try {
        const twiml = getTwiMLForRecording(params.recordingEnabled);

        const call = await twilioClient.calls.create({
            to: formatPhoneNumber(params.toNumber),
            from: params.fromNumber || twilioPhoneNumber,
            twiml: twiml,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            record: params.recordingEnabled ? true : false,
            recordingStatusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/recording-status`,
            machineDetection: 'Enable', // Detecta máquina de contestador
        });

        console.log('✅ Outbound call initiated:', call.sid);
        return call.sid;
    } catch (error) {
        console.error('❌ Error initiating outbound call:', error);
        throw error;
    }
}

// ============================================================================
// GRABACIÓN DE LLAMADAS
// ============================================================================

/**
 * Obtiene TwiML para grabación de llamadas
 */
function getTwiMLForRecording(recordingEnabled?: boolean): string {
    const recordTag = recordingEnabled 
        ? '<Record timeout="0" recordingStatusCallback="/api/twilio/recording-status" />'
        : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            ${recordTag}
            <Say language="es-ES">Conectando con un agente, por favor espere.</Say>
            <Pause length="1"/>
        </Response>`;
}

/**
 * Obtiene TwiML para IVR con grabación
 */
function getTwiMLForIVR(menu: IVRMenu, recordingEnabled?: boolean): string {
    const recordTag = recordingEnabled
        ? '<Record timeout="0" recordingStatusCallback="/api/twilio/recording-status" />'
        : '';

    const gatherOptions = menu.options
        .map((opt) => `<Say language="es-ES">${opt.digit}. ${opt.description}</Say>`)
        .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            ${recordTag}
            <Gather numDigits="1" timeout="${menu.timeout || 10}" method="POST" action="/api/twilio/ivr-input">
                <Say language="es-ES">${menu.prompt}</Say>
                ${gatherOptions}
                <Say language="es-ES">Presione cualquier opción para continuar.</Say>
            </Gather>
            <Say language="es-ES">No recibimos tu entrada. Reintentando.</Say>
            <Redirect>/api/twilio/ivr</Redirect>
        </Response>`;
}

// ============================================================================
// TRANSFERENCIAS
// ============================================================================

/**
 * Transfiere una llamada a otro agente
 */
export async function transferCall(params: CallTransferParams): Promise<void> {
    if (!twilioClient) {
        throw new Error('Twilio not configured');
    }

    try {
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Dial>
                    <Number>${formatPhoneNumber(params.transferToNumber)}</Number>
                </Dial>
            </Response>`;

        await twilioClient.calls(params.callSid).update({
            twiml: twiml,
        });

        console.log('✅ Call transferred:', params.callSid);
    } catch (error) {
        console.error('❌ Error transferring call:', error);
        throw error;
    }
}

// ============================================================================
// GRABACIONES
// ============================================================================

/**
 * Obtiene lista de grabaciones
 */
export async function getRecordings(limit: number = 20) {
    if (!twilioClient) return null;

    try {
        const recordings = await twilioClient.recordings.list({ limit });
        return recordings.map((r) => ({
            sid: r.sid,
            duration: r.duration,
            dateCreated: r.dateCreated,
            uri: r.uri,
            mediaUrl: `https://api.twilio.com${r.uri.replace('.json', '.wav')}`,
        }));
    } catch (error) {
        console.error('❌ Error getting recordings:', error);
        return null;
    }
}

/**
 * Obtiene URL de grabación
 */
export function getRecordingUrl(recordingSid: string): string {
    if (!accountSid || !authToken) return '';
    
    return `https://${accountSid}:${authToken}@api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.wav`;
}

// ============================================================================
// MENSAJES SMS (para notificaciones)
// ============================================================================

/**
 * Envía SMS de notificación
 */
export async function sendSMS(toNumber: string, message: string): Promise<boolean> {
    if (!twilioClient) return false;

    try {
        await twilioClient.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: formatPhoneNumber(toNumber),
        });
        return true;
    } catch (error) {
        console.error('❌ Error sending SMS:', error);
        return false;
    }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Formatea número de teléfono al formato internacional
 */
export function formatPhoneNumber(phone: string): string {
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

/**
 * Valida formato de teléfono
 */
export function isValidPhoneNumber(phone: string): boolean {
    const formatted = formatPhoneNumber(phone);
    return /^\+\d{10,15}$/.test(formatted);
}

/**
 * Obtiene estado de la llamada en tiempo real
 */
export async function getCallStatus(callSid: string): Promise<any> {
    if (!twilioClient) return null;

    try {
        const call = await twilioClient.calls(callSid).fetch();
        return {
            sid: call.sid,
            status: call.status,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            from: call.from,
            to: call.to,
            dateCreated: call.dateCreated,
        };
    } catch (error) {
        console.error('❌ Error getting call status:', error);
        return null;
    }
}

/**
 * Termina una llamada
 */
export async function hangupCall(callSid: string): Promise<void> {
    if (!twilioClient) return;

    try {
        await twilioClient.calls(callSid).update({ status: 'completed' });
        console.log('✅ Call ended:', callSid);
    } catch (error) {
        console.error('❌ Error ending call:', error);
    }
}

export default twilioClient;
