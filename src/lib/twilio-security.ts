/**
 * TWILIO WEBHOOK SIGNATURE VALIDATION
 * 
 * PROBLEMA: Los webhooks actuales no validan que las peticiones vengan de Twilio.
 * RIESGO: Cualquier atacante puede simular llamadas de Twilio y manipular datos.
 * 
 * SOLUCIÓN: Implementar validación HMAC usando twilio.validateRequest()
 * 
 * COSTO OPERACIONAL: Ninguno - solo mejora seguridad sin impacto en rendimiento.
 */

import { validateRequest } from 'twilio';
import { logSecurityAlert } from './security-alerts';

/**
 * Valida que una petición POST venga realmente de Twilio
 * @param request NextRequest object
 * @param formData FormData from request
 * @returns true si la firma es válida
 */
export async function validateTwilioRequest(
  request: Request,
  formData: FormData
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    console.error('⚠️ TWILIO_AUTH_TOKEN not configured - cannot validate signature');
    return false;
  }

  try {
    // Get the signature from headers
    const twilioSignature = request.headers.get('X-Twilio-Signature') || '';
    
    // Get the full URL
    const url = new URL(request.url);
    const fullUrl = url.toString();

    // Convert FormData to params object
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate using Twilio's built-in method
    const isValid = validateRequest(
      authToken,
      twilioSignature,
      fullUrl,
      params
    );

    if (!isValid) {
      console.error('🔴 SECURITY ALERT: Invalid Twilio signature detected', {
        url: fullUrl,
        signature: twilioSignature.substring(0, 10) + '...',
      });
      
      // Log security alert
      await logSecurityAlert({
        alert_type: 'webhook_rejected',
        severity: 'high',
        source: 'twilio',
        endpoint: fullUrl,
        details: {
          signature: twilioSignature.substring(0, 20) + '...',
          timestamp: new Date().toISOString(),
        },
        metadata: { params },
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}

/**
 * Middleware para rate limiting en webhooks
 * Previene ataques de denegación de servicio
 */
const webhookRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkWebhookRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; resetTime: number } {
  const now = Date.now();
  const record = webhookRateLimits.get(identifier);

  if (!record || now > record.resetTime) {
    webhookRateLimits.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, resetTime: record.resetTime };
}
