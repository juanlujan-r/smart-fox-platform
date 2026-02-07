# 📞 Configuración de Twilio Call Center - Smart Fox Platform

## ✅ Paso 1: Variables de Entorno (COMPLETADO)

Tu archivo `.env.local` ya está configurado con:
- ✅ TWILIO_ACCOUNT_SID
- ✅ TWILIO_AUTH_TOKEN  
- ✅ NEXT_PUBLIC_TWILIO_PHONE_NUMBER
- ✅ NEXT_PUBLIC_APP_URL

---

## 🔑 Paso 2: Obtener Service Role Key de Supabase

**IMPORTANTE**: Necesitas agregar una variable más al `.env.local`:

1. Ve a tu panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (⚙️) → **API**
4. Copia el **`service_role`** key (NO el anon key)
5. Abre `.env.local` y descomenta/actualiza esta línea:
   ```env
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGc...tu_key_aqui"
   ```

---

## 🌐 Paso 3: Configurar Variables en Vercel

Necesitas agregar las mismas variables en tu proyecto de Vercel:

```bash
# Comando para agregar todas de una vez
vercel env add TWILIO_ACCOUNT_SID
# Pegar: TU_TWILIO_ACCOUNT_SID

vercel env add TWILIO_AUTH_TOKEN
# Pegar: TU_TWILIO_AUTH_TOKEN

vercel env add NEXT_PUBLIC_TWILIO_PHONE_NUMBER
# Pegar: +18789997381

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Pegar: tu_service_role_key (del paso 2)
```

**O manualmente en el Dashboard de Vercel:**
1. Ve a: https://vercel.com/juanlujans-projects/smart-fox-platform/settings/environment-variables
2. Agrega cada variable para **Production**, **Preview**, y **Development**

---

## 📡 Paso 4: Configurar Webhooks en Twilio

Ve a tu panel de Twilio y configura estos webhooks para tu número:

### 4.1 Configurar el Número de Teléfono

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/active
2. Haz clic en tu número: **+1 (878) 999-7381**
3. En la sección **Voice Configuration**:

   **A call comes in:**
   ```
   Webhook: https://smart-fox-platform.vercel.app/api/twilio/incoming-call
   HTTP POST
   ```

   **Call Status Changes:**
   ```
   Webhook: https://smart-fox-platform.vercel.app/api/twilio/call-status
   HTTP POST
   ```

4. En la sección **Messaging Configuration** (si usas SMS):
   ```
   A message comes in:
   Webhook: https://smart-fox-platform.vercel.app/api/twilio/incoming-message
   HTTP POST
   ```

5. Haz clic en **Save** (botón rojo al final de la página)

---

## 🚀 Paso 5: Hacer Deploy

```bash
# Hacer commit de los cambios locales
git add .env.local
git commit -m "config: Add Twilio credentials"

# Deploy a Vercel
git push origin main

# Vercel auto-deploys en cada push
```

**⚠️ IMPORTANTE**: El archivo `.env.local` NO se sube a GitHub (está en .gitignore). Las variables de entorno de producción deben estar en Vercel.

---

## 🧪 Paso 6: Probar la Configuración

### Desde tu aplicación local:

```bash
# Iniciar servidor de desarrollo
npm run dev

# La app estará en http://localhost:3000
```

1. Inicia sesión con un usuario gerente o supervisor
2. Ve a **Call Center** en el menú
3. Deberías ver el panel de llamadas
4. Intenta hacer una llamada de prueba

### Desde producción:

1. Ve a: https://smart-fox-platform.vercel.app/call-center
2. Inicia sesión
3. Haz una llamada de prueba

**Para probar llamadas entrantes:**
1. Llama a tu número de Twilio: **+1 (878) 999-7381**
2. Deberías escuchar el IVR (menú de voz)
3. La llamada debería aparecer en el panel de Call Center

---

## 📊 Verificar que Todo Funciona

### Checklist:

- [ ] El `.env.local` tiene todas las variables (incluyendo SUPABASE_SERVICE_ROLE_KEY)
- [ ] Las variables están en Vercel (Settings → Environment Variables)
- [ ] Los webhooks están configurados en Twilio
- [ ] El deploy en Vercel se completó sin errores
- [ ] Puedes acceder a https://smart-fox-platform.vercel.app/call-center
- [ ] Al llamar al número, escuchas el IVR
- [ ] Las llamadas aparecen en el panel

---

## 🆘 Solución de Problemas

### Error: "Twilio not configured"
- Verifica que las variables de entorno estén en Vercel
- Verifica que hiciste deploy después de agregarlas

### Error: "Missing Supabase credentials"
- Asegúrate de tener el SUPABASE_SERVICE_ROLE_KEY configurado
- Verifica que la URL de Supabase sea correcta

### Las llamadas no llegan al panel
- Verifica los webhooks en Twilio (deben apuntar a tu dominio de Vercel)
- Revisa los logs en Vercel: https://vercel.com/juanlujans-projects/smart-fox-platform/logs

### No escucho el IVR al llamar
- Verifica que el webhook "A call comes in" esté configurado
- Verifica que la URL sea HTTPS (no HTTP)
- Revisa los logs de errores en Twilio Console

---

## 📞 Endpoints de API Disponibles

Tu aplicación ahora tiene estos endpoints funcionando:

- `POST /api/twilio/incoming-call` - Recibe llamadas entrantes (IVR)
- `POST /api/twilio/call-status` - Actualiza estado de llamadas
- `POST /api/twilio/initiate-call` - Inicia llamadas salientes
- `POST /api/twilio/ivr-input` - Procesa opciones del menú IVR
- `POST /api/twilio/recording-status` - Estado de grabaciones
- `POST /api/twilio/transfer-call` - Transfiere llamadas
- `POST /api/twilio/hangup-call` - Cuelga llamadas

---

## 🎯 Próximos Pasos

Una vez que todo funcione:

1. **Configurar agentes**: Ve a Call Center → Agents y asigna agentes
2. **Personalizar IVR**: Edita los scripts de voz en Call Center → IVR Scripts
3. **Configurar colas**: Crea colas de llamadas para diferentes departamentos
4. **Monitorear métricas**: Revisa las estadísticas en tiempo real

---

¿Necesitas ayuda con algún paso? ¡Dime y te guío! 🚀
