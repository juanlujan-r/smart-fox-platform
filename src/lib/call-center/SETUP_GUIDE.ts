/**
 * TWILIO SETUP GUIDE
 * Pasos para configurar Twilio y el Call Center
 */

export const TWILIO_SETUP_GUIDE = `
# 📞 CALL CENTER TWILIO SETUP GUIDE

## 1. CREAR CUENTA TWILIO

### Paso 1: Registrarse en Twilio
1. Ir a https://www.twilio.com/console
2. Crear cuenta (necesita teléfono de verificación)
3. Verificar teléfono con código SMS

### Paso 2: Obtener Credenciales
En la Twilio Console:
1. Dashboard → Copiar **Account SID**
2. Dashboard → Copiar **Auth Token** (tiene un ojo para mostrar)
3. Darle a "Get a Trial Number" para obtener número Twilio

### Paso 3: Obtener Teléfono Twilio
1. Phone Numbers → Manage Numbers → Buy a Number
2. Seleccionar país (Colombia +57)
3. Buscar número disponible
4. Comprar número (se usa crédito de prueba)

IMPORTANTE: Twilio proporciona $15 de crédito de prueba (cada llamada cuesta $0.01-0.02)

---

## 2. CONFIGURAR VARIABLES DE ENTORNO

Crear archivo \`.env.local\` en la raíz del proyecto:

\`\`\`env
# Twilio Credentials
NEXT_PUBLIC_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_TWILIO_PHONE_NUMBER=+57xxxxxxxxx

# Supabase (ya debe estar configurado)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx

# App URL (para webhooks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
\`\`\`

### Obtener credenciales Twilio:

**Account SID:**
- Twilio Console → Home → Copy Account SID

**Auth Token:**
- Twilio Console → Home → Copiar Auth Token (clic en ojo)

**Phone Number:**
- Phone Numbers → Active Numbers → Copiar número en formato +57

---

## 3. CONFIGURAR WEBHOOKS EN TWILIO

Los webhooks permiten que Twilio notifique a tu app de eventos.

### 3.1 Webhook de Llamada Entrante

1. Twilio Console → Phone Numbers → Active Numbers
2. Hacer clic en tu número
3. En "Voice Configuration":
   - **A Call Comes In** → TwiML App
   - **Friendly Name**: "Smart Fox Call Center"
   - **Voice URL**: \`https://yourdomain.com/api/twilio/incoming-call\`
   - **Voice Method**: POST
   - Guardar

### 3.2 Webhooks adicionales

En el mismo número, agregar:

**Call Status Callback:**
\`https://yourdomain.com/api/twilio/call-status\`

**Recording Status Callback:**
\`https://yourdomain.com/api/twilio/recording-status\`

---

## 4. ESTRUCTURA DEL CÓDIGO

### Servicios:
\`src/lib/call-center/\`
- \`twilio.ts\` - Integración con Twilio API
- \`supabase.ts\` - Operaciones de base de datos

### Componentes React:
\`src/components/call-center/\`
- \`AgentPanel.tsx\` - Panel para agentes (recibir/hacer llamadas)
- \`CallCenterDashboard.tsx\` - Dashboard para supervisores
- \`CRMContactManager.tsx\` - Gestión de contactos
- \`IVRScriptManager.tsx\` - Crear scripts IVR

### Hooks:
\`src/hooks/call-center/\`
- \`useCallCenter.ts\` - Hook principal para llamadas

### API Routes:
\`src/app/api/twilio/\`
- \`incoming-call/route.ts\` - Recibe llamadas entrantes
- \`call-status/route.ts\` - Actualiza estado de llamadas
- \`ivr-input/route.ts\` - Procesa entrada del usuario en IVR
- \`recording-status/route.ts\` - Notificación de grabaciones

### Página:
\`src/app/(dashboard)/call-center/page.tsx\` - Página principal

---

## 5. FLUJO DE UNA LLAMADA ENTRANTE

1. **Cliente marca número Twilio** (+57xxxxxxxxx)
2. Twilio envía POST a \`/api/twilio/incoming-call\`
3. El server retorna TwiML con mensaje de bienvenida + IVR
4. **Usuario presiona dígito** (1, 2, o 3)
5. Twilio envía POST a \`/api/twilio/ivr-input\` con digit
6. Sistema enruta a cola de agentes
7. **Si hay agente disponible**: transfiere llamada al agente
8. **Si no hay agente**: graba voicemail
9. Al finalizar: Twilio notifica en \`/api/twilio/call-status\`
10. Llamada guardada en DB con duración, grabación, notas

---

## 6. FLUJO DE UNA LLAMADA SALIENTE

1. **Agente usa AgentPanel** y escribe número
2. Click en "Llamar" → se llama a \`startCall()\` del hook
3. Hook crea registro en DB + llama Twilio API
4. **Twilio marca el número** del cliente
5. Llamada se graba automáticamente
6. Agente puede transferir, tomar notas, etc
7. Agente termina llamada → se actualiza DB
8. Grabación disponible en Dashboard

---

## 7. USO DE COMPONENTES

### AgentPanel (Hacer/recibir llamadas)

\`\`\`tsx
import { AgentPanel } from '@/components/call-center/AgentPanel';

export default function MyPage() {
    return <AgentPanel />;
}
\`\`\`

**Características:**
- Entrada de número para llamadas
- Estado del agente (disponible, en pausa, offline)
- Información del contacto en tiempo real
- Historial de llamadas
- Transferencia de llamadas
- Grabación de notas

### CallCenterDashboard (Monitoreo)

\`\`\`tsx
import { CallCenterDashboard } from '@/components/call-center/CallCenterDashboard';

export default function SupervisorPage() {
    return <CallCenterDashboard />;
}
\`\`\`

**Características:**
- Estadísticas en tiempo real
- Lista de agentes y su estado
- Historial de todas las llamadas
- Acceso a grabaciones

### CRMContactManager (Gestión de clientes)

\`\`\`tsx
import { CRMContactManager } from '@/components/call-center/CRMContactManager';

export default function CRMPage() {
    return <CRMContactManager />;
}
\`\`\`

**Características:**
- Buscar contactos
- Ver historial de llamadas de contacto
- Actualizar información del contacto
- Agregar notas

### IVRScriptManager (Configurar menús)

\`\`\`tsx
import { IVRScriptManager } from '@/components/call-center/IVRScriptManager';

export default function IVRPage() {
    return <IVRScriptManager />;
}
\`\`\`

**Características:**
- Crear/editar scripts IVR
- Configurar mensajes de bienvenida
- Mapear dígitos a colas
- Vista previa de menú

---

## 8. HOOK useCallCenter

\`\`\`tsx
import { useCallCenter } from '@/hooks/call-center/useCallCenter';

function MyCallComponent() {
    const {
        agentProfile,         // Perfil del agente
        agentStatus,          // 'available' | 'busy' | 'break' | 'offline'
        updateAgentStatus,    // (status: string) => Promise<void>
        
        currentCall,          // Llamada actual
        isCallActive,         // boolean
        startCall,            // (phoneNumber: string) => Promise<void>
        endCall,              // () => Promise<void>
        transferCall,         // (toNumber: string) => Promise<void>
        
        currentContact,       // Contacto CRM
        contactHistory,       // Historial de llamadas
        loadContact,          // (phoneNumber: string) => Promise<void>
        updateContact,        // (updates: Partial<CRMContact>) => Promise<void>
        
        loading,              // boolean
        error,                // string | null
        success,              // string | null
    } = useCallCenter();

    return (
        <>
            {/* Tu UI aquí */}
        </>
    );
}
\`\`\`

---

## 9. BASE DE DATOS

Se crea automáticamente con migration:
\`supabase/migrations/20260207000004_call_center_system.sql\`

Tablas principales:
- \`call_center_agents\` - Perfil de agentes
- \`call_records\` - Histórico de todas las llamadas
- \`crm_contacts\` - Contactos de clientes
- \`call_queues\` - Colas de llamadas (Ventas, Soporte, etc)
- \`ivr_scripts\` - Scripts de IVR
- \`voicemails\` - Mensajes de voz
- \`call_notes\` - Notas de agentes

---

## 10. COSTOS ESTIMADOS (Twilio)

**Llamadas entrantes:** $0.0075 por minuto
**Llamadas salientes:** $0.013 por minuto
**Grabaciones:** Incluido (hasta 7 días)
**SMS:** $0.0075 por mensaje
**IVR (DTMF):** Incluido

**Estimado mensual para 100 llamadas/día:**
- 100 llamadas × 5 min promedio = 500 min/día
- 500 min/día × 30 días = 15,000 min/mes
- 15,000 min × $0.013 = **~$195/mes**

Más barato si usas IVR antes de transferir.

---

## 11. TROUBLESHOOTING

### Problema: "Twilio not configured"
**Solución:** Verifica \`.env.local\` tiene TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN

### Problema: Webhooks no se ejecutan
**Solución:** Verifica que URLs tienen dominio público (no localhost)
Usa ngrok para testing local: \`ngrok http 3000\`

### Problema: Llamadas no se graban
**Solución:** Asegúrate que \`recordingEnabled: true\` en \`startCall()\`

### Problema: IVR no funciona
**Solución:** 
1. Verifica que \`/api/twilio/incoming-call\` retorna TwiML válida
2. Comprueba transcripción en Twilio Console → Debugger
3. Verifica caracteres especiales en mensajes (acentos, etc)

---

## 12. NEXT STEPS

1. ✅ Crear cuenta Twilio y números
2. ✅ Agregar credenciales en .env.local
3. ✅ Configurar webhooks en Twilio Console
4. ✅ Ejecutar migración de BD (\`npx supabase db push\`)
5. ✅ Crear perfil de agente para tu usuario
6. ✅ Probar AgentPanel con llamadas salientes
7. ✅ Probar IVR con llamadas entrantes
8. ✅ Usar CRM para gestionar contactos
9. ✅ Monitorear con Dashboard

---

## 13. RECURSOS

- Twilio Docs: https://www.twilio.com/docs
- TwiML Reference: https://www.twilio.com/docs/voice/twiml
- Twilio Console: https://www.twilio.com/console
- Community: https://twilio.com/community

---

**Versión:** 1.0
**Última actualización:** 2026-02-07
`;

export default TWILIO_SETUP_GUIDE;
