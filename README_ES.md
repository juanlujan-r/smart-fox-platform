# Smart Fox Platform - Sistema de Gestión Empresarial

Plataforma integral de gestión empresarial con módulos de RH, Inventario, POS, Asistencia y Nómina. Construida con Next.js 16, React 19 y Supabase (PostgreSQL).

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Arquitectura](#arquitectura)
6. [Funcionalidades Principales](#funcionalidades-principales)
7. [Guía de Desarrollo](#guía-de-desarrollo)
8. [Base de Datos](#base-de-datos)
9. [Autenticación y Roles](#autenticación-y-roles)
10. [Comandos Útiles](#comandos-útiles)
11. [Usuarios de Prueba](#usuarios-de-prueba)
12. [Migraciones](#migraciones)
13. [Troubleshooting](#troubleshooting)

---

## Descripción General

Smart Fox Platform es una solución empresarial completa que centraliza la gestión de:

- **Gestión de Talento (RH)**: Control de nómina, asistencia, solicitudes de permisos, horarios
- **Pos (Punto de Venta)**: Sistema de ventas con carrito de compras y órdenes
- **Inventario**: Gestión de productos y stock
- **Asistencia**: Registro en tiempo real de entrada/salida, descansos, reuniones
- **Nómina y Salarios**: Cálculo de pagos, auditoría de cambios salariales

### Stack Tecnológico

- **Frontend**: Next.js 16.1.6, React 19.2.3, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL 17.6), API REST
- **Autenticación**: Supabase Auth con JWT
- **Almacenamiento**: Supabase Storage (Buckets)
- **Herramientas**: Supabase CLI v2.75.5, ESLint, Prettier

---

## Requisitos Previos

### Sistema Operativo y Software

- Node.js 18+ (se recomienda 20.x LTS)
- npm 9+ o pnpm 8+
- Git
- Supabase CLI v2.75+

### Instalación de Herramientas

```bash
# Instalar Node.js (usar nvm si es posible)
# En Windows, usar https://nodejs.org
# En macOS: brew install node@20

# Instalar Supabase CLI
npm install -g supabase

# Verificar instalación
node --version
npm --version
supabase --version
```

### Cuentas Requeridas

- Cuenta de Supabase (https://supabase.com)
- Proyecto de Supabase remoto y local
- Credenciales de acceso a base de datos

---

## Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/juanlujan-r/smart-fox-platform.git
cd smart-fox-platform
```

### 2. Instalar Dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uzwrpnvdilcltozonkpj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>

# Servidor Local
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
```

### 4. Inicializar Base de Datos Local

```bash
# Inicializar Supabase local
supabase start

# Aplicar migraciones
supabase db push

# Verificar que está corriendo en http://127.0.0.1:54321
```

### 5. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## Estructura del Proyecto

```
smart-fox-platform/
├── src/
│   ├── app/                          # App router de Next.js
│   │   ├── (auth)/                   # Rutas de autenticación
│   │   │   └── login/
│   │   ├── (dashboard)/              # Dashboard con layout protegido
│   │   │   ├── admin/                # Solo gerentes - Analytics
│   │   │   ├── approvals/            # Supervisores/Gerentes - Aprobaciones
│   │   │   ├── hr/                   # Gestión de Talento
│   │   │   ├── hr-management/        # Equipo, Horarios, Solicitudes
│   │   │   ├── inventory/            # Gestión de Inventario (Gerentes)
│   │   │   ├── pos/                  # Punto de Venta (Gerentes)
│   │   │   ├── profile/              # Perfil de Usuario
│   │   │   ├── requests/             # Solicitudes de RH
│   │   │   ├── shifts/               # Gestión de Turnos
│   │   │   ├── dashboard/            # Dashboard principal
│   │   │   └── layout.tsx            # Layout dashboard
│   │   ├── api/                      # API routes
│   │   │   └── auth/check/
│   │   ├── globals.css               # Estilos globales
│   │   ├── layout.tsx                # Layout raíz
│   │   └── page.tsx                  # Página inicial
│   │
│   ├── components/                   # Componentes reutilizables
│   │   ├── AuthGuard.tsx             # Protección de rutas (deprecado, usar RoleGuard)
│   │   ├── RoleGuard.tsx             # Protección por roles (RBAC)
│   │   ├── SalesChart.tsx            # Gráficos de ventas
│   │   ├── productCar.tsx            # Tarjeta de producto
│   │   ├── ToastContainer.tsx        # Sistema de notificaciones
│   │   ├── dashboard/
│   │   │   └── ManagerDashboard.tsx  # Dashboard de gerentes
│   │   ├── documents/
│   │   │   └── CertificateTemplate.tsx # Generador de certificados
│   │   ├── hr/                       # Componentes de RH
│   │   │   ├── PayrollGenerator.tsx  # Generador de nómina
│   │   │   ├── SalaryManager.tsx     # Gestor de salarios
│   │   │   ├── ShiftControl.tsx      # Control de turnos
│   │   │   └── __tests__/
│   │   │       └── ShiftControl.test.tsx
│   │   ├── layout/                   # Componentes de layout
│   │   │   ├── MobileNav.tsx         # Navegación móvil
│   │   │   ├── NotificationBar.tsx   # Barra de notificaciones
│   │   │   ├── Sidebar.tsx           # Barra lateral (con filtro de roles)
│   │   │   └── TopBar.tsx            # Barra superior
│   │   ├── pos/
│   │   │   └── ProductCard.tsx       # Tarjeta de producto POS
│   │   ├── inventory/
│   │   │   └── ProductForm.tsx       # Formulario de producto
│   │   └── ui/
│   │       └── ToastContainer.tsx    # Contenedor de notificaciones
│   │
│   ├── context/
│   │   └── ToastContext.tsx          # Contexto global de notificaciones
│   │
│   ├── lib/
│   │   ├── supabase.ts               # Cliente Supabase (lado cliente)
│   │   └── supabase/
│   │       ├── proxy.ts              # Proxy del cliente
│   │       └── server.ts             # Cliente Supabase (lado servidor)
│   │
│   ├── store/
│   │   └── cartStore.ts              # Zustand store para carrito
│   │
│   ├── types/
│   │   └── database.ts               # TypeScript types de la BD
│   │
│   └── middleware.ts                 # Middleware de Next.js (autenticación)
│
├── supabase/
│   ├── config.toml                   # Configuración de Supabase
│   ├── seed.sql                      # Script de inicialización
│   ├── migrations/                   # Migraciones de BD
│   │   ├── 20260205120000_complete_database_schema.sql
│   │   ├── 20260206120000_security_hardening.sql
│   │   ├── 20260206120001_profiles_investor_requirements.sql
│   │   ├── 20260206215707_remote_schema.sql
│   │   ├── 20260207000001_add_missing_test_users.sql
│   │   ├── 20260207000002_reset_test_passwords.sql
│   │   └── 20260207000003_populate_user_data.sql
│   └── snippets/
│
├── public/                           # Archivos estáticos
├── package.json                      # Dependencias del proyecto
├── tsconfig.json                     # Configuración de TypeScript
├── next.config.ts                    # Configuración de Next.js
├── tailwind.config.ts                # Configuración de Tailwind CSS
├── postcss.config.mjs                # Configuración de PostCSS
├── eslint.config.mjs                 # Configuración de ESLint
├── PROJECT_INDEX.md                  # Índice del proyecto
├── SETUP_DATABASE.md                 # Guía de setup de BD
│
└── TEST_USERS_CREDENTIALS.md         # Credenciales de usuarios de prueba

```

---

## Arquitectura

### Diagrama de Flujo de Autenticación

```
Usuario → Login (/app/(auth)/login)
           ↓
        Supabase Auth
           ↓
        JWT en localStorage
           ↓
        middleware.ts (validar token)
           ↓
        RoleGuard (verificar rol)
           ↓
        Dashboard Protegido
```

### Flujo de Control de Acceso (RBAC)

```
RoleGuard Component
  ↓
1. Obtener usuario: supabase.auth.getUser()
2. Fetch rol desde profiles table: supabase.from('profiles').select('role')
3. Comparar: userRole ∈ allowedRoles[]?
   ↓ SÍ: Renderizar componente
   ↓ NO: Redirigir a /dashboard
```

### Estructura de Datos de Usuario

```typescript
profiles {
  id: uuid (PK, FK → auth.users.id)
  role: 'empleado' | 'supervisor' | 'gerente'
  full_name: string
  document_id: string (cédula)
  document_type: 'CC' | 'CE' | 'TI'
  hiring_date: date
  contract_type: 'Indefinido' | 'Fijo' | 'Temporal'
  base_salary: numeric
  minute_rate: numeric (auto-calculado: salary / 12600)
  
  // JSON data
  personal_data: {
    email, phone, address, city, birth_date, gender,
    emergency_name, emergency_phone
  }
  medical_data: {
    eps, arl, blood_type, allergies, pension
  }
  sizes_data: { shirt, pants, shoes }
  bank_account: {
    account_number, bank_name, ach_code, account_type
  }
}
```

---

## Funcionalidades Principales

### 1. **Gestión de RH (Módulo HR)**

#### Gestión de Equipo (`/hr-management`)
- **Estado en Vivo**: Visualizar estado actual de cada empleado (entrada, descanso, almuerzo, offline)
- **Solicitudes Pendientes**: Aprobar/rechazar permisos, incapacidades, vacaciones
- **Alertas de Ausencia**: Empleados sin registro de entrada después de 15 minutos de su turno
- **Nómina y Salarios**: (Solo gerentes) Gestión de salarios y generación de nómina

#### Gestión de Talento (`/hr`)
- Registro de empleados
- Control de turnos
- Información de contacto y emergencia

#### Gestión de Horarios
- Visualizar horarios semanales
- Modificar turnos
- Solicitar cambio de turno

### 2. **Asistencia y Turnos**

#### Registro de Asistencia (`/shifts`)
- Entrada/Salida
- Descansos (Almuerzo, Café, Reuniones)
- Visualizar historial con duración por estado
- Solicitar cambio de turno con pares disponibles
- Validaciones: máx 10h/día, mín 10h entre turnos

#### Attendance Logs
- Tabla `attendance_logs`: Cada marcación registra estado y ubicación
- RLS: Usuarios ven solo sus logs, Admins ven todos
- Auditoría automática de cambios

### 3. **Solicitudes de RH**

Tipos de solicitudes (`/requests`):
- 🎫 **Permiso Personal**: Permisos sin especialidad
- 🏥 **Incapacidad Médica**: Requiere adjunto (certificado)
- 🏖️ **Vacaciones**: Solicitud de período de descanso
- 📋 **Novedad**: Reportes de eventos especiales

**Flujo de Aprobación**:
```
Empleado crea solicitud → Supervisor revisa (si es empleado) 
                        → Gerente revisa y aprueba/rechaza
                        → Registro actualizado
```

### 4. **Nómina y Salarios** (Solo Gerentes)

#### Gestor de Salarios (`SalaryManager`)
- CRUD de salarios base
- Cálculo automático de rate por minuto (Ley 2101 Colombia)
- Auditoría de cambios salariales en tabla `salary_audit`

#### Generador de Nómina (`PayrollGenerator`)
- Seleccionar período (mensual)
- Calcular automáticamente:
  - Horas trabajadas de `attendance_logs`
  - Bonificaciones, descuentos, aportes
- Generar `payroll_runs` y `payroll_items`
- PDF exportable

### 5. **Inventario** (Solo Gerentes)

- CRUD sobre tabla `products`
- Campos: nombre, precio, stock, categoría, imagen
- Búsqueda y filtrado
- Validaciones de stock

### 6. **Punto de Venta (POS)** (Solo Gerentes)

- Visualizar productos disponibles
- Carrito de compras (Zustand store)
- Cálculo automático de impuestos
- Orden de compra
- Resumen de órdenes

### 7. **Dashboard Analytics** (Solo Gerentes)

- KPI principales: ventas, empleados, asistencia
- Gráficos de desempeño
- Indicadores por departamento

### 8. **Aprobaciones** (Supervisores y Gerentes)

Interfaz centralizada para:
- Solicitudes de RH pendientes
- Cambios de turno
- Horas extra
- Botones: Aprobar, Rechazar, Ver adjuntos

---

## Guía de Desarrollo

### Estándares de Código

#### TypeScript
- Usar tipos explícitos siempre
- Interfaces para tipos de datos
- Enums para valores booleanos o enumerables

```typescript
// ✅ Bien
interface User {
  id: string;
  role: 'empleado' | 'supervisor' | 'gerente';
  email: string;
}

// ❌ Evitar
const user = {} as any;
```

#### React Components
- Usar componentes funcionales
- Hooks para estado y efectos
- Server Components cuando sea posible

```typescript
// ✅ Bien
'use client';

import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // fetch data
  }, []);
  
  return <div>{data}</div>;
}

// ❌ Evitar
export default class MyComponent extends React.Component {}
```

#### Supabase Queries
- Usar tipos generados de TypeScript
- Validar errores siempre
- Usar RLS para seguridad

```typescript
// ✅ Bien
const { data, error } = await supabase
  .from('profiles')
  .select('id, role, full_name')
  .eq('id', userId)
  .single();

if (error) {
  console.error('Error:', error.message);
  return null;
}

// ❌ Evitar - sin validación de error
const { data } = await supabase.from('profiles').select('*');
```

### Crear Nuevo Componente

```typescript
// src/components/MyComponent.tsx

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction?: (value: string) => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  const [state, setState] = useState('');

  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <h3 className="font-bold text-gray-900">{title}</h3>
      <button
        onClick={() => onAction?.(state)}
        className="mt-4 px-4 py-2 rounded-lg bg-[#FF8C00] text-white"
      >
        Acción
      </button>
    </div>
  );
}
```

### Crear Nueva Página Protegida

```typescript
// src/app/(dashboard)/mypage/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RoleGuard from '@/components/RoleGuard';

function MyPageContent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('your_table')
        .select('*');
      
      if (error) {
        console.error('Error:', error);
      } else {
        setData(data || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Mi Página</h1>
      {/* Contenido */}
    </div>
  );
}

export default function MyPage() {
  return (
    <RoleGuard allowedRoles={['gerente', 'supervisor']}>
      <MyPageContent />
    </RoleGuard>
  );
}
```

### Usar RoleGuard para Proteger Páginas

```typescript
// Importar
import RoleGuard from '@/components/RoleGuard';

// Usar
export default function ProtectedPage() {
  return (
    <RoleGuard 
      allowedRoles={['gerente']}
      fallbackPath="/dashboard"
    >
      <MyContent />
    </RoleGuard>
  );
}

// Roles disponibles: 'empleado' | 'supervisor' | 'gerente'
```

---

## Base de Datos

### Tablas Principales

#### Autenticación
- `auth.users`: Usuario de Supabase (email, contraseña encriptada)
- `auth.identities`: Proveedores de identidad (email, google, etc)

#### Usuarios y Perfiles
- `profiles`: Información completa del usuario (roles, datos personales, médicos, bancarios)

#### Asistencia
- `attendance_logs`: Cada marcación/cambio de estado del empleado
- `schedules`: Horarios programados

#### Solicitudes
- `hr_requests`: Permisos, incapacidades, vacaciones
- `shift_exchange_requests`: Solicitudes de cambio de turno

#### Nómina
- `payroll_runs`: Período de nómina
- `payroll_items`: Línea individual de pago
- `salary_audit`: Auditoría de cambios salariales

#### Operacional
- `products`: Inventario
- `orders`: Órdenes de compra (POS)
- `order_items`: Items en orden

### Row Level Security (RLS)

Todas las tablas tienen RLS activo:

```sql
-- Usuarios ven solo sus datos
CREATE POLICY "Users view own data" ON profiles
FOR SELECT USING (auth.uid() = id);

-- Admins (supervisor, gerente) ven todos
CREATE POLICY "Admins view all data" ON profiles
FOR SELECT USING (public.check_is_admin());
```

La función `check_is_admin()` verifica si el usuario tiene rol 'supervisor' o 'gerente'.

### Triggers Automáticos

1. **on_auth_user_created**: Cuando se crea usuario en auth.users, se crea automáticamente en profiles
2. **update_updated_at**: Campo updated_at se actualiza automáticamente
3. **calculate_minute_rate**: Calcula rate por minuto basado en salary

---

## Autenticación y Roles

### Flujo de Login

```typescript
// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@smartfox.com',
  password: 'password123'
});

// JWT se almacena en localStorage automáticamente
// Middleware valida en cada petición
```

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| **empleado** | Ver su perfil, registrar asistencia, crear solicitudes de RH |
| **supervisor** | Ver equipo, aprobar solicitudes de empleados, gestionar horarios |
| **gerente** | Acceso total, analytics, gestión de inventario/POS, nómina |

### Protección de Rutas

#### Middleware (nivel Next.js)
```typescript
// src/middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-token')?.value;
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

#### RoleGuard Component (nivel React)
```typescript
// src/components/RoleGuard.tsx
export default function RoleGuard({ allowedRoles, children }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (allowedRoles.includes(profile.role)) {
        setAuthorized(true);
      }
    };

    checkRole();
  }, []);

  return authorized ? children : <Redirect />;
}
```

---

## Comandos Útiles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Linter
npm run lint

# Formatear código
npm run format
```

### Supabase

```bash
# Iniciar BD local
supabase start

# Detener BD local
supabase stop

# Ver logs
supabase logs local

# Crear migración
supabase migration new <nombre>

# Aplicar migraciones local
supabase db push

# Aplicar migraciones remoto
supabase db push --remote

# Sincronizar local con remoto
supabase db pull

# Reiniciar BD local (CUIDADO: borra datos)
supabase db reset
```

### Git

```bash
# Ver cambios pendientes
git status

# Commit con mensaje
git commit -m "feat: Description"

# Push a main
git push origin main

# Pull cambios
git pull origin main

# Ver historial
git log --oneline -10
```

---

## Usuarios de Prueba

Todos los usuarios pueden login con contraseña: **Test1234!**

### Gerente (Acceso Total)
| Email | Nombre | Rol |
|-------|--------|-----|
| gerente1@smartfox.com | Carlos Germán Rodríguez Martínez | Gerente |

### Supervisores
| Email | Nombre | Rol |
|-------|--------|-----|
| supervisor1@smartfox.com | José Miguel Sánchez Díaz | Supervisor |
| supervisor2@smartfox.com | Laura Patricia Gutierrez Ramírez | Supervisor |

### Empleados
| Email | Nombre | Rol |
|-------|--------|-----|
| emp1@smartfox.com | David Fernando Morales Castillo | Empleado |
| emp2@smartfox.com | Stephanie Nova García López | Empleado |
| emp3@smartfox.com | Andrés Felipe Mendoza Ruiz | Empleado |
| emp4@smartfox.com | Valentina Salazar Peña | Empleado |
| emp5@smartfox.com | Marco Antonio López Jiménez | Empleado |
| emp6@smartfox.com | Camila Sofía Rodríguez Vélez | Empleado |
| emp7@smartfox.com | Ricardo Alejandro Hernández Silva | Empleado |
| emp8@smartfox.com | Michelle Alejandra Cortés Díaz | Empleado |
| emp9@smartfox.com | Javier Eduardo García Martínez | Empleado |
| emp10@smartfox.com | Daniela Patricia González Morales | Empleado |

**Todos tienen:**
- Contraseña: `Test1234!`
- Cédula, datos personales, médicos, bancarios
- Horarios para 30 días laborales
- Registros de asistencia de ejemplo

---

## Migraciones

Las migraciones se encuentran en `supabase/migrations/`. Se ejecutan automáticamente en orden:

### 20260205120000_complete_database_schema.sql
- Schema completo de todas las tablas
- Funciones auxiliares (check_is_admin, update_updated_at, etc)
- RLS policies
- Índices

### 20260206120000_security_hardening.sql
- Refuerzo de seguridad
- Políticas RLS adicionales

### 20260206120001_profiles_investor_requirements.sql
- Campos adicionales para requisitos inversores

### 20260206215707_remote_schema.sql
- Cambios en esquema remoto
- Tablas adicionales (categorías, disciplinary_actions, etc)

### 20260207000001_add_missing_test_users.sql
- Agrega 12 usuarios de prueba faltantes
- Sincroniza local con remoto

### 20260207000002_reset_test_passwords.sql
- Resetea contraseñas de todos los usuarios a Test1234!

### 20260207000003_populate_user_data.sql
- Llena todos los campos RH
- Genera horarios para 30 días
- Crea registros de asistencia de ejemplo

### Crear Nueva Migración

```bash
supabase migration new nombre_descriptivo

# Editar archivo generado en supabase/migrations/
# Luego aplicar:
supabase db push
```

---

## Troubleshooting

### "Cannot find module '@/lib/supabase'"

**Problema**: TypeScript no encuentra imports con alias
**Solución**:
```bash
# Limpiar caché de Next.js
rm -rf .next

# Reinstalar dependencias
npm install

# Verifica tsconfig.json tiene paths: { "@/*": ["src/*"] }
```

### "Error: User does not have permission"

**Problema**: RLS está bloqueando la consulta
**Solución**:
1. Verificar que JWT está en localStorage
2. Verificar que usuario existe en `profiles`
3. Verificar RLS policy permite la operación
4. Ver en Supabase Dashboard > SQL Editor > Auth Tokens

### "Database connection refused"

**Problema**: BD local no está corriendo
**Solución**:
```bash
supabase start

# Si sigue fallando:
supabase stop
supabase start --no-verify
```

### "Roles no están funcionando / todos ven toda información"

**Problema**: RLS no está aplicándose correctamente
**Solución**:
1. Verificar que RLS está enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
2. Verificar que existen policies: `SELECT * FROM pg_policies WHERE tablename='table_name'`
3. Limpiar localStorage y volver a login

### "Horarios no aparecen"

**Problema**: Migración 20260207000003 no se ejecutó
**Solución**:
```bash
# Verificar migraciones ejecutadas
supabase migration list --remote

# Ejecutar manualmente
supabase db push
```

---

## Recursos Útiles

### Documentación Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

### Tutoriales
- [Supabase + Next.js Tutorial](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security Patterns](https://supabase.com/docs/guides/auth/row-level-security)
- [Zustand State Management](https://github.com/pmndrs/zustand)

### Comandos Git Útiles

```bash
# Ver diferencias
git diff

# Ver commit específico
git show <commit-hash>

# Revertir último commit (solo local)
git reset --soft HEAD~1

# Ver ramas
git branch -a

# Cambiar rama
git checkout -b <rama>
```

---

## Próximas Mejoras Planeadas

- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con sistemas de pago
- [ ] Módulo de evaluaciones de desempeño
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Mobile app (React Native)
- [ ] Multiidioma
- [ ] CI/CD con GitHub Actions

---

## Contribuir

1. Fork el repositorio
2. Crea rama: `git checkout -b feature/nombre`
3. Commit cambios: `git commit -m "feat: descripción"`
4. Push: `git push origin feature/nombre`
5. Abre Pull Request

### Convenciones de Commits

```
feat: Agregar nueva funcionalidad
fix: Corregir bug
docs: Cambios en documentación
style: Formateo, semicolons, etc
refactor: Refactorizar código sin cambios funcionales
test: Agregar o modificar tests
chore: Cambios en herramientas de build, dependencias
```

---

## Licencia

Proyecto privado de Smart Fox Solutions. 

---

## Contacto

**Juan Luján** - juan.lujan@smartfox.com

---

**Última actualización**: 7 de febrero de 2026
**Versión**: 1.0.0
**Estado**: En desarrollo activo ✅

