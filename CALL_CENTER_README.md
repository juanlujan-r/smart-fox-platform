# ☎️ CALL CENTER SYSTEM - Smart Fox Platform

## Descripción

Sistema completo de Call Center integrado en Smart Fox Platform con:

✅ **Llamadas entrante y saliente** con Twilio
✅ **IVR (Interactive Voice Response)** básico configurable
✅ **Grabación de llamadas** automática
✅ **CRM integrado** para gestión de contactos
✅ **Historial completo** de llamadas
✅ **Dashboard en tiempo real** para supervisores
✅ **Panel de agentes** para hacer/recibir llamadas
✅ **Transferencia de llamadas** entre agentes

---

## 🎯 Características principales

### 📱 Panel de Agente
- Interfaz para agentes realizar/recibir llamadas
- Estado del agente (disponible, ocupado, descanso, offline)
- Información del contacto en tiempo real
- Tomar notas durante la llamada
- Transferir llamadas a otros agentes
- Historial de contactos

### 📊 Dashboard Supervisor
- Estadísticas en tiempo real (agentes disponibles, llamadas activas, colas)
- Monitoreo de todos los agentes
- Historial de todas las llamadas
- Acceso a grabaciones
- Análisis de duración y disposición

### 📇 CRM de Contactos
- Buscar contactos por teléfono, email, nombre
- Ver información completa del contacto
- Historial de llamadas por contacto
- Editar notas y datos del cliente
- Clasificar contactos (cliente, prospecto, lead)

### 🎙️ Gestor IVR
- Crear y editar scripts de respuesta interactiva
- Configurar menús con dígitos (1, 2, 3, etc)
- Asignar colas de destino por opción
- Establecer timeout y reintentos
- Vista previa de menú

### 🎙️ Llamadas Salientes
- Marcar número desde el panel
- Grabación automática
- Ver información del cliente mientras suena
- Tomar notas
- Transferir si es necesario

### 📥 Llamadas Entrantes
- IVR automático
- Enrutamiento a colas por departamento
- Fallback a voicemail si no hay agentes
- Transcripción de voicemails

---

## 🔧 Arquitectura técnica

### Stack
- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Twilio API
- **Real-time**: Supabase Realtime
- **Audio**: Twilio Communications

### Estructura de carpetas

```
src/
├── app/(dashboard)/call-center/
│   └── page.tsx                 # Página principal
├── api/twilio/
│   ├── incoming-call/           # Recibir llamadas
│   ├── call-status/             # Actualizar estado
│   ├── recording-status/        # Procesar grabaciones
│   └── ivr-input/               # Manejar entradas IVR
├── components/call-center/
│   ├── AgentPanel.tsx           # Panel de agente
│   ├── CallCenterDashboard.tsx  # Dashboard
│   ├── CRMContactManager.tsx    # Gestor CRM
│   └── IVRScriptManager.tsx     # Gestor IVR
├── hooks/call-center/
│   └── useCallCenter.ts         # Hook principal
└── lib/call-center/
    ├── twilio.ts                # Servicio Twilio
    ├── supabase.ts              # Servicio Supabase
    └── SETUP_GUIDE.ts           # Guía de configuración
```

### Base de datos

Tablas principales:
- `call_center_agents` - Perfiles de agentes
- `call_records` - Historiales de llamadas
- `crm_contacts` - Contactos de clientes
- `call_queues` - Colas de enrutamiento
- `ivr_scripts` - Scripts de IVR
- `voicemails` - Mensajes de voz
- `call_notes` - Notas de llamadas

---

## 🚀 Instalación y Setup

### 1. Prerequisitos
- Cuenta Twilio (https://www.twilio.com)
- Supabase ya configurado
- Node.js 18+

### 2. Obtener credenciales Twilio

1. Ir a https://www.twilio.com/console
2. Copiar **Account SID**
3. Copiar **Auth Token**
4. Obtener **Numero de Twilio** (Phone Numbers → Buy)

### 3. Configurar .env.local

```env
# Twilio
NEXT_PUBLIC_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_TWILIO_PHONE_NUMBER=+57xxxxxxxxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase (ya debe estar)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx
```

### 4. Correr migraciones

```bash
# Crear tablas call center
npx supabase db push

# O si prefieres ver cambios
npx supabase db push --dry-run
```

### 5. Configurar webhooks en Twilio

En Twilio Console → Phone Numbers → Tu número:

**Voice URL:** `https://yourdomain.com/api/twilio/incoming-call`
**Voice Method:** POST

Para testing local, usar ngrok:
```bash
ngrok http 3000
# Usar URL de ngrok en webhooks
```

### 6. Crear perfil de agente

En la base de datos (o desde admin):
```sql
INSERT INTO public.call_center_agents 
  (user_id, extension, agent_status, skills)
VALUES 
  ('user-uuid', '1001', 'offline', '{"general": true}'::jsonb);
```

### 7. Verificar permisos

El usuario debe tener rol `supervisor` o `gerente`:
```sql
UPDATE public.profiles 
SET role = 'supervisor' 
WHERE id = 'user-uuid';
```

---

## 📖 Uso

### Para Agentes

1. Navegar a `/call-center`
2. Cambiar estado a "Disponible"
3. **Llamada saliente**: Escribir número y presionar "Llamar"
4. **Durante llamada**: Ver datos del cliente, tomar notas, transferir
5. Presionar "Finalizar Llamada" cuando termine

### Para Supervisores

1. Navegar a `/call-center`
2. Ver "Dashboard" para estadísticas
3. Monitorear agentes en la tabla
4. Ver historial de todas las llamadas
5. Acceder a grabaciones

### Para Gestionar CRM

1. Tab "CRM" en call-center
2. Buscar contacto (teléfono, email, nombre)
3. Ver información y historial
4. Editar datos del contacto

### Para Configurar IVR

1. Tab "IVR" en call-center
2. Editar scripts de bienvenida
3. Agregar/remover opciones
4. Asignar colas por dígito
5. Guardar

---

## 🔄 Flujos de llamadas

### Llamada Entrante

```
1. Cliente marca +57xxxxxxxxx
2. Twilio recibe → /api/twilio/incoming-call
3. Se reproduce IVR ("Presione 1, 2, o 3")
4. Cliente presiona dígito
5. Twilio → /api/twilio/ivr-input
6. Sistema enruta a cola apropiada
7. Si agente disponible → transfiere
8. Si no → guarda voicemail
9. Llama finaliza → /api/twilio/call-status
10. Registro guardado en DB
```

### Llamada Saliente

```
1. Agente escribe número en panel
2. startCall() → crea registro en DB
3. Twilio API inicia llamada
4. Cliente recibe llamada
5. Agente puede ver datos, tomar notas
6. Agente puede transferir
7. endCall() → finaliza y actualiza DB
8. Grabación procesada
```

### Transferencia

```
1. Agente en llamada activa presiona "Transferir"
2. Escribe número del destinatario
3. transferCall() → Twilio transfiere
4. Originalmente marcado como "transferido"
5. Segundo agente toma la llamada
```

---

## 🎨 Componentes

### useCallCenter Hook

```tsx
const {
    agentProfile,      // Tu perfil
    agentStatus,       // Estado actual
    updateAgentStatus, // Cambiar estado
    
    currentCall,       // Llamada activa
    startCall,         // Iniciar nueva
    endCall,           // Terminar
    transferCall,      // Transferir
    
    currentContact,    // Cliente actual
    contactHistory,    // Sus llamadas
    loadContact,       // Cargar por #
    updateContact,     // Actualizar datos
    
    loading, error, success,
} = useCallCenter();
```

### Servicios

**twilio.ts**
```tsx
// Llamadas
await initiateOutboundCall({ toNumber, agentId, recordingEnabled: true })
await transferCall({ callSid, transferToNumber })
await hangupCall(callSid)

// Grabaciones
const recordings = await getRecordings(20)
const url = getRecordingUrl(recordingSid)

// SMS notificaciones
await sendSMS(toNumber, message)

// Utilitarios
formatPhoneNumber(phone)      // +57xxxxx
isValidPhoneNumber(phone)     // boolean
```

**supabase.ts**
```tsx
// Agentes
await getAgentProfile()
await createAgentProfile(userId, extension, skills)
await updateAgentStatus(agentId, status)
await getAvailableAgents()

// Llamadas
await createCallRecord(callData)
await updateCallRecord(callId, updates)
await getAgentCallHistory(agentId, limit)
await getContactCallHistory(contactId)
await getCallCenterStats()

// CRM
await getOrCreateContact(phoneNumber, data)
await updateContact(contactId, updates)
await searchContacts(query, contactType)
await addCallNote(callRecordId, noteText)
```

---

## 💰 Costos

### Twilio
- **Llamadas entrantes**: $0.0075/min
- **Llamadas salientes**: $0.013/min
- **Grabaciones**: Incluido (7 días)
- **SMS**: $0.0075/msg

**Estimado**: ~$200-300/mes con 100 llamadas/día

### Supabase
- Incluido en plan actual
- Storage: $5 por 1GB adicional
- API: incluido

---

## 🔒 Seguridad

### RLS (Row Level Security)
- Agentes solo ven sus propias llamadas
- Solo supervisores ven todas las llamadas
- Contactos solo accesibles por admin

### Auth
- Sistema usa JWT de Supabase
- Endpoints validados con auth.uid()
- Datos sensibles no en .env

### Grabaciones
- URLs temporales con expiración
- Solo accesibles por usuarios autenticados
- Almacenadas en Twilio (encriptadas)

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Twilio not configured" | Verifica .env.local tiene credenciales |
| Webhooks no se ejecutan | Usa dominio público, no localhost. O usa ngrok |
| Llamadas no se graban | Verifica `recordingEnabled: true` |
| IVR no funciona | Revisa TwiML en /api/twilio/incoming-call |
| No puedo transferir | Agentes necesitan role >= "supervisor" |

---

## 📚 Documentación adicional

Ver `src/lib/call-center/SETUP_GUIDE.ts` para:
- Setup detallado de Twilio
- Ejemplos de código
- Configuración de webhooks
- Best practices

---

## 🚀 Próximas características

- [ ] Dashboard de análisis avanzado
- [ ] Reportes de productividad
- [ ] Queue callback (espera sin colgar)
- [ ] Conferencias de 3+ agentes
- [ ] Whisper coaching (supervisor escucha sin que sepa cliente)
- [ ] Predictive dialer para llamadas salientes
- [ ] Screen pop (abrir CRM al recibir llamada)
- [ ] Mobile app para agentes
- [ ] Integración con Twilio Flex
- [ ] Análisis de sentimiento de llamadas

---

## 📞 Soporte

Para issues:
1. Revisar SETUP_GUIDE.ts
2. Revisar Twilio debugger en console
3. Ver logs en terminal
4. Revisar RLS policies en Supabase

---

**Versión**: 1.0  
**Actualizado**: 2026-02-07  
**Autor**: Smart Fox Platform
