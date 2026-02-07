# Smart Fox Platform - Enterprise Management System

Una plataforma integral de gestión empresarial para RH, Inventario, POS, Asistencia y Nómina. Construida con Next.js 16, React 19 y Supabase (PostgreSQL).

## 📚 Documentación

**[→ DOCUMENTACIÓN COMPLETA EN ESPAÑOL](./README_ES.md)**

Lee la documentación completa en español para que desarrolladores y Copilot IA puedan entender la arquitectura del proyecto, la configuración y contribuir de manera efectiva.

---

## Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm 9+
- Supabase CLI v2.75+
- Git

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/juanlujan-r/smart-fox-platform.git
cd smart-fox-platform

# Instalar dependencias
npm install

# Configurar variables de entorno
nano .env.local  # Agregar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

# Iniciar BD local
supabase start

# Aplicar migraciones
supabase db push

# Ejecutar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Características Principales

✅ **Control de Acceso Basado en Roles (RBAC)** - Empleado, Supervisor, Gerente  
✅ **Gestión de RH** - Asistencia, Horarios, Solicitudes, Nómina  
✅ **Sistema de Inventario** - Gestión de productos y stock  
✅ **Punto de Venta (POS)** - Órdenes de compra  
✅ **Centro de Llamadas (Call Center)** - IVR, CRM, grabación, estadísticas, gráficas, reportes y alertas  
✅ **Dashboard en Tiempo Real** - KPIs y análisis del equipo  
✅ **Row-Level Security** - Seguridad a nivel de BD  
✅ **TypeScript** - Seguridad de tipos completa  
✅ **Usuarios de Prueba** - 13 usuarios preconfigurados con datos completos  

---

## Usuarios de Prueba

**Contraseña para todos**: `Test1234!`

| Email | Nombre | Rol |
|-------|--------|-----|
| gerente1@smartfox.com | Carlos Germán Rodríguez | Gerente |
| supervisor1@smartfox.com | José Miguel Sánchez | Supervisor |
| supervisor2@smartfox.com | Laura Patricia Gutierrez | Supervisor |
| emp1-emp10@smartfox.com | Varios nombres | Empleado |

---

## Stack Tecnológico

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL 17.6), API REST
- **Autenticación**: Supabase Auth con JWT
- **Almacenamiento**: Supabase Storage
- **Herramientas**: Supabase CLI v2.75.5, ESLint, Prettier
- **Gráficas y Reportes**: Recharts, XLSX
- **Telefonía**: Twilio

---

## Estructura del Proyecto

```
smart-fox-platform/
├── src/
│   ├── app/                    # App Router de Next.js
│   │   ├── (auth)/             # Páginas de login
│   │   ├── (dashboard)/        # Rutas protegidas
│   │   └── api/                # Endpoints de API
│   ├── components/             # Componentes reutilizables
│   │   ├── RoleGuard.tsx       # Protección RBAC
│   │   └── hr/                 # Componentes de RH
│   ├── lib/                    # Utilidades
│   ├── store/                  # Estados Zustand
│   ├── types/                  # Tipos TypeScript
│   └── context/                # React Context
├── supabase/
│   ├── migrations/             # Migraciones de BD
│   ├── config.toml             # Config Supabase
│   └── seed.sql                # Script de inicialización
├── public/                     # Archivos estáticos
└── package.json                # Dependencias
```

---

## 🆕 Centro de Llamadas (Call Center)

Sistema profesional de call center integrado con:

- **☎️ Llamadas Entrantes y Salientes** con Twilio
- **🎙️ IVR (Respuesta Interactiva de Voz)** configurable
- **📇 CRM integrado** con historial y filtros avanzados
- **🎙️ Grabación automática** de llamadas
- **📊 Estadísticas en tiempo real** y panel configurable
- **📈 Gráficas de desempeño** y estado de llamadas
- **📤 Reportes en Excel** bajo demanda y programados (local)
- **⚠️ Alertas configurables** por umbrales de operación
- **📊 Dashboard supervisor** en tiempo real
- **🎧 Panel de agente** para recibir/hacer llamadas

**[→ DOCUMENTACIÓN CALL CENTER](./CALL_CENTER_README.md)**

Para usar:
1. Crear cuenta Twilio (gratuita)
2. Agregar credenciales en `.env.local`
3. Correr: `npx supabase db push`
4. Ir a `/call-center`

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor dev
npm run build            # Compilar para producción
npm run lint             # Ejecutar linter
npm run format           # Formatear código

# Base de Datos
supabase start           # Iniciar BD local
supabase db push         # Aplicar migraciones
supabase db reset        # Reiniciar BD (⚠️ borra datos)
supabase logs local      # Ver logs

# Git
git commit -m "feat: descripción"
git push origin main
```

---

## Documentación

- **[README_ES.md](./README_ES.md)** - Documentación completa en español (REFERENCIA PRINCIPAL)
- **[SETUP_DATABASE.md](./SETUP_DATABASE.md)** - Guía de configuración de BD
- **[PROJECT_INDEX.md](./PROJECT_INDEX.md)** - Índice del proyecto
- **[TEST_USERS_CREDENTIALS.md](./TEST_USERS_CREDENTIALS.md)** - Credenciales de prueba

---

## Roles y Permisos (RBAC)

| Rol | Permisos |
|-----|----------|
| **Empleado** | Ver su perfil, registrar asistencia, crear solicitudes |
| **Supervisor** | Gestionar equipo, aprobar solicitudes, horarios |
| **Gerente** | Acceso total, analytics, inventario, POS, nómina |

---

## Características de Seguridad

✅ **Row-Level Security (RLS)** - Políticas PostgreSQL  
✅ **Autenticación JWT** - Tokens seguros  
✅ **Contraseñas Encriptadas** - bcrypt hashing  
✅ **Protección CORS** - Orígenes restringidos  
✅ **Auditoría** - Registro de cambios  
✅ **Validación de Roles** - En servidor y cliente  

---

## Obtener Ayuda

1. Lee [README_ES.md](./README_ES.md) para documentación completa
2. Revisa [SETUP_DATABASE.md](./SETUP_DATABASE.md) para ayuda con BD
3. Consulta ejemplos en el historial de Git
4. Ve tipos TypeScript en `src/types/database.ts`

---

## Despliegue

### A Producción

```bash
# Compilar
npm run build

# Push a Supabase remoto
supabase db push --remote

# Desplegar a Vercel (o tu hosting)
# Conectar repo GitHub a Vercel dashboard
# Auto-despliega en push a main
```

---

## Licencia

Proyecto privado de Smart Fox Solutions.

---

## Última Actualización

**7 de febrero de 2026** - Documentación y datos de usuarios completados ✅  
**Versión**: 1.0.0  
**Estado**: En Desarrollo Activo

---

**Para la guía completa, consulta [README_ES.md](./README_ES.md)** ↗
