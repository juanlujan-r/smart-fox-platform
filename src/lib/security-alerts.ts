/**
 * SISTEMA DE ALERTAS DE SEGURIDAD
 * Monitorea webhooks rechazados y genera alertas para el equipo de seguridad
 */

import { createClient } from '@supabase/supabase-js';

export interface SecurityAlert {
  alert_type: 'webhook_rejected' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  endpoint: string;
  details: {
    ip_address?: string;
    user_agent?: string;
    signature?: string;
    phone_number?: string;
    attempt_count?: number;
    timestamp: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Registra un incidente de seguridad en la base de datos
 */
export async function logSecurityAlert(alert: SecurityAlert): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('⚠️ Cannot log security alert: Supabase credentials missing');
      return;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insertar alerta en tabla de auditoría
    const { error } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: alert.alert_type,
        severity: alert.severity,
        source: alert.source,
        endpoint: alert.endpoint,
        details: alert.details,
        metadata: alert.metadata || {},
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging security alert:', error);
    } else {
      console.log(`🔔 Security alert logged: ${alert.alert_type} (${alert.severity})`);
    }

    // Si es crítico, enviar notificación inmediata
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await sendCriticalAlertNotification(alert);
    }
  } catch (error) {
    console.error('Failed to log security alert:', error);
  }
}

/**
 * Envía notificación para alertas críticas
 * TODO: Integrar con Slack/Discord/Email según configuración
 */
async function sendCriticalAlertNotification(alert: SecurityAlert): Promise<void> {
  // Placeholder para integración futura
  console.error(`
╔═══════════════════════════════════════════════════════════════╗
║  🚨 CRITICAL SECURITY ALERT                                   ║
╠═══════════════════════════════════════════════════════════════╣
║  Type:     ${alert.alert_type.padEnd(50)}║
║  Severity: ${alert.severity.toUpperCase().padEnd(50)}║
║  Endpoint: ${alert.endpoint.padEnd(50)}║
║  Source:   ${alert.source.padEnd(50)}║
║  Time:     ${alert.details.timestamp.padEnd(50)}║
╚═══════════════════════════════════════════════════════════════╝
  `);

  // TODO: Implementar notificaciones reales
  // - Slack Webhook: process.env.SLACK_SECURITY_WEBHOOK
  // - Discord Webhook: process.env.DISCORD_SECURITY_WEBHOOK
  // - Email: SendGrid/Mailgun para equipo de seguridad
}

/**
 * Obtiene estadísticas de alertas de seguridad
 */
export async function getSecurityStats(hours: number = 24): Promise<{
  total_alerts: number;
  critical_alerts: number;
  rejected_webhooks: number;
  rate_limits: number;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase credentials missing');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const { data, error } = await supabase
      .from('security_alerts')
      .select('alert_type, severity')
      .gte('created_at', since.toISOString());

    if (error) throw error;

    return {
      total_alerts: data?.length || 0,
      critical_alerts: data?.filter(a => a.severity === 'critical').length || 0,
      rejected_webhooks: data?.filter(a => a.alert_type === 'webhook_rejected').length || 0,
      rate_limits: data?.filter(a => a.alert_type === 'rate_limit_exceeded').length || 0,
    };
  } catch (error) {
    console.error('Error fetching security stats:', error);
    return { total_alerts: 0, critical_alerts: 0, rejected_webhooks: 0, rate_limits: 0 };
  }
}
