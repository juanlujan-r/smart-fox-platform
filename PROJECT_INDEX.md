# Smart Fox Platform — Project Index

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase, Zustand, Recharts

---

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

### `src/context/` — React Context

| File | Purpose |
|------|---------|
| `ToastContext.tsx` | Toast notification state and API |

### `src/store/` — State (Zustand)

| File | Purpose |
|------|---------|
| `cartStore.ts` | POS cart state (items, quantities, totals) |

### `src/lib/` — Utilities & Supabase

| File | Purpose |
|------|---------|
| `supabase.ts` | Supabase client (browser) |
| `supabase/server.ts` | Supabase server client |
| `supabase/proxy.ts` | Supabase proxy helpers |

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

---

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

---

*Generated as a project index for navigation and onboarding.*
