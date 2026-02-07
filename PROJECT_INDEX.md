# Smart Fox Platform — Project Index

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL 17.6), Zustand, Recharts  
**Estado**: Producción Lista ✅  
**Última Revisión**: 7 de febrero de 2026

---

## Resumen de Compilación

✅ Build sin errores  
✅ 20 migraciones aplicadas correctamente  
✅ 13 usuarios de prueba con datos completos  
✅ Datos de empleados 100% completados  
✅ Validación de nulos completada  
✅ Documentación actualizada

## Root

| File / Dir | Purpose |
|------------|--------|
| `package.json` | Dependencies: Next 16, React 19, Supabase (ssr + js), Zustand, Recharts, date-fns, lucide-react, clsx, tailwind-merge |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Tailwind CSS config |
| `tsconfig.json` | TypeScript config |
| `proxy.ts` | Root proxy (if used for dev) |
| `public/` | Static assets (SVGs, etc.) |

---

## `src/` — Application Source

### `src/app/` — Next.js App Router

| Route / File | Description |
|--------------|-------------|
| `layout.tsx` | Root layout |
| `page.tsx` | Home/landing page |
| `globals.css` | Global styles |
| **(auth)** | Auth route group |
| `(auth)/login/page.tsx` | Login page |
| **(dashboard)** | Dashboard route group (shared layout) |
| `(dashboard)/layout.tsx` | Dashboard layout (sidebar, etc.) |
| `(dashboard)/dashboard/page.tsx` | Main dashboard |
| `(dashboard)/hr/page.tsx` | HR page (shift control, attendance) |
| `(dashboard)/inventory/page.tsx` | Inventory management |
| `(dashboard)/inventory/ProductForm.tsx` | Product create/edit form |
| `(dashboard)/pos/page.tsx` | POS (point of sale) page |
| `(dashboard)/pos/OrderSummary.tsx` | POS order summary |
| **(dashboard)/call-center** | Call center (NEW!) |
| `(dashboard)/call-center/page.tsx` | Call center dashboard with stats, agents, calls |
| **api** | API routes |
| `api/auth/check/route.ts` | Auth check endpoint |
### `src/components/` — React Components

| Component | Role |
|-----------|------|
| `AuthGuard.tsx` | Protects routes; redirects unauthenticated users |
| `layout/Sidebar.tsx` | Dashboard sidebar navigation |
| `layout/MobileNav.tsx` | Mobile navigation |
| `hr/ShiftControl.tsx` | HR shift start/end and related controls |
| `hr/__tests__/ShiftControl.test.tsx` | Tests for ShiftControl |
| `pos/ProductCard.tsx` | POS product card UI |
| `productCar.tsx` | Product car/cart UI (name suggests typo: “Car” vs “Cart”) |
| `SalesChart.tsx` | Sales chart (likely Recharts) |
| `ui/ToastContainer.tsx` | Toast notifications container |
| **call-center/** | Call center components (NEW!) |
| `call-center/AgentPanel.tsx` | Agent UI for making/receiving calls |
| `call-center/CallCenterDashboard.tsx` | Supervisor dashboard with analytics, charts, alerts, scheduled reports |
| `call-center/CRMContactManager.tsx` | Contact management with call history and advanced filters |
| `call-center/IVRScriptManager.tsx` | IVR menu creator with DB persistence |

### `src/context/` — React Context

| File | Purpose |
|------|---------|
| `ToastContext.tsx` | Toast notification state and API |

### `src/store/` — State (Zustand)

| File | Purpose |
|------|---------|
| `cartStore.ts` | POS cart state (items, quantities, totals) |

### `src/hooks/` — Custom React Hooks

| File | Purpose |
|------|---------|
| **call-center** | Call center hooks (NEW!) |
| `call-center/useCallCenter.ts` | Main hook for call management, agent status, CRM |

### `src/lib/` — Utilities & Supabase

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client (browser) |
| `supabase/server.ts` | Supabase server client |
| `supabase/proxy.ts` | Supabase proxy helpers |
| **call-center** | Call center services (NEW!) |
| `call-center/supabase.ts` | Call center DB operations (agents, calls, CRM, IVR) |
| `call-center/twilio.ts` | Twilio integration (calls, recordings, SMS) |
| `call-center/SETUP_GUIDE.ts` | Call center setup documentation |

### `src/types/` — TypeScript Types

| File | Purpose |
|------|---------|
| `database.ts` | Shared types: `Product`, `Category`, `CartItem`, `Order` |

---

## `supabase/` — Backend & DB

| File | Purpose |
|------|---------|
| `migrations/20260204_add_attendance_notes_location.sql` | Migration: attendance notes + location |

---

## Feature Areas (Quick Reference)

- **Auth:** `(auth)/login`, `AuthGuard`, `api/auth/check`, Supabase auth
- **Dashboard:** `(dashboard)/layout`, `Sidebar`, `MobileNav`
- **HR:** `(dashboard)/hr/page`, `ShiftControl`, attendance migration
- **POS:** `(dashboard)/pos`, `OrderSummary`, `ProductCard`, `cartStore`, `productCar`
- **Inventory:** `(dashboard)/inventory`, `ProductForm`, `Product` / `Category` types
- **UI/UX:** `ToastContext`, `ToastContainer`, `globals.css`, Tailwind
- **Call Center (NEW!):** `(dashboard)/call-center`, `AgentPanel`, `CallCenterDashboard` (alertas, reportes, gráficas), `CRMContactManager` (filtros avanzados), `IVRScriptManager`, `useCallCenter`, `call-center/supabase`, `call-center/twilio`

---

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

---

*Generated as a project index for navigation and onboarding.*
