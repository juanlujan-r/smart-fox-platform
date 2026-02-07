# Smart Fox Platform - AI Agent Instructions

## Overview
Enterprise management system with HR, Inventory, POS, and Call Center modules. Built with Next.js 16 (App Router), React 19, TypeScript, Supabase (PostgreSQL), and Tailwind CSS 4.

## Architecture & Key Concepts

### Authentication & Authorization
- **3-tier role system**: `empleado` (employee), `supervisor`, `gerente` (manager)
- **Double-layer protection**: 
  - [src/middleware.ts](../src/middleware.ts): Route-level auth checks
  - [src/components/RoleGuard.tsx](../src/components/RoleGuard.tsx): Component-level role enforcement
- **Profile-based auth**: User role stored in `profiles.role`, NOT in auth.users metadata
- Session refresh happens in middleware on every request (Supabase SSR pattern)

### Database (Supabase/PostgreSQL)
- **Row Level Security (RLS)**: All tables use RLS policies with `check_is_admin()` helper
- **Critical convention**: PostgreSQL functions MUST include:
  ```sql
  SECURITY DEFINER SET search_path = public
  ```
  This prevents RLS recursion errors
- **Never use `SELECT *` in triggers** - explicitly list columns to avoid performance issues
- **Schema location**: [supabase/migrations/](../supabase/migrations/) - always create new migrations, never edit existing ones
- **Seed data**: 13 test users with password `Test1234!` (see [TEST_USERS_CREDENTIALS.md](../TEST_USERS_CREDENTIALS.md))

### State Management Patterns
- **Zustand for client state**: See [src/store/cartStore.ts](../src/store/cartStore.ts) - minimalist pattern with direct Supabase calls
- **React Context for UI state**: See [src/context/ToastContext.tsx](../src/context/ToastContext.tsx)
- **No Redux** - Keep it simple with Zustand + direct Supabase queries

### Supabase Client Usage
- **Browser client**: `@/lib/supabase` (via `createBrowserClient`)
- **Server client**: `@/lib/supabase/server` (via `createServerClient` with cookies)
- **API routes**: Use server client with cookies from request
- **Never share clients between server/client contexts**

## Project Structure Patterns

### Route Organization
```
src/app/
├── (auth)/login/              # Public auth routes
├── (dashboard)/               # Protected routes with shared layout
│   ├── layout.tsx             # Sidebar + navigation
│   ├── dashboard/             # Main dashboard (all roles)
│   ├── hr/                    # HR features (supervisor+)
│   ├── inventory/             # Inventory (gerente only)
│   ├── pos/                   # Point of sale (gerente only)
│   └── call-center/           # Call center (agents+)
└── api/                       # API routes (Twilio webhooks, etc.)
```

### Component Structure
- **Page components**: In `app/*/page.tsx` - handle data fetching & role checks
- **Feature components**: In `components/{feature}/` - reusable, role-agnostic
- **Layout components**: In `components/layout/` - Sidebar, TopBar, MobileNav
- **Use `'use client'`** for all components with hooks/state

## Development Workflows

### Local Development
```bash
supabase start              # Start local Supabase (runs on 127.0.0.1:54321)
npm run dev                 # Start Next.js dev server (localhost:3000)
supabase db reset           # Reset DB + run all migrations + seed
supabase db push            # Apply new migrations without reset
```

### Database Changes
1. Create migration: `supabase migration new feature_name`
2. Write SQL with RLS policies + triggers
3. Apply locally: `supabase db push`
4. Test with test users (gerente1@smartfox.com / supervisor1@smartfox.com / emp1@smartfox.com)
5. Commit migration file

### Adding New Protected Routes
```tsx
// 1. Add route to middleware.ts PROTECTED_PREFIXES
// 2. Wrap page in RoleGuard if role-specific:
import RoleGuard from '@/components/RoleGuard';

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['gerente']}>
      {/* page content */}
    </RoleGuard>
  );
}
```

## Module-Specific Conventions

### HR Module
- **Shift tracking**: Uses `attendance_logs` table with states: entrada, descanso, almuerzo, reunion, offline
- **Payroll**: `minute_rate` auto-calculated via trigger (Colombian law: 210 hrs/month = 12600 min/month)
- **Salary audits**: `salary_audits` tracks all changes with who/when/why

### POS Module
- **Cart flow**: Zustand store → `processSale()` creates `orders` + `order_items` in transaction
- **No inventory decrement** - manual inventory management in separate module

### Call Center Module
- **Twilio integration**: Webhooks in [src/app/api/twilio/](../src/app/api/twilio/)
- **Real-time updates**: Supabase Realtime subscriptions in [src/hooks/call-center/useCallCenter.ts](../src/hooks/call-center/useCallCenter.ts)
- **IVR scripts**: Stored as JSONB in `call_center_ivr_scripts`
- See [CALL_CENTER_README.md](../CALL_CENTER_README.md) for setup

### Inventory Module
- **Manager-only**: Route protected at middleware + RoleGuard level
- **Products table**: Standard CRUD with categories, stock tracking

## Code Style & Patterns

### TypeScript
- **Database types**: Auto-generated in [src/types/database.ts](../src/types/database.ts) - DO NOT manually edit
- **Component props**: Always define inline interfaces or types
- **Async/await**: Prefer over promises for readability

### Error Handling
- **Supabase errors**: Check `error` object, log with context
- **User-facing errors**: Use ToastContext for notifications
- **Never expose DB errors to users** - map to friendly messages

### Styling
- **Tailwind CSS 4**: Use utility classes, defined in [tailwind.config.ts](../tailwind.config.ts)
- **Color palette**: Primary orange (#f47c20), dark backgrounds (#1a1a1a)
- **Responsive**: Mobile-first with `md:`, `lg:` breakpoints

## Common Tasks

### Add New Table
1. Create migration with table + RLS policies + indexes
2. Add TypeScript types to database.ts (or regenerate: `supabase gen types typescript`)
3. Create Zustand store if complex state needed
4. Build UI components with appropriate role guards

### Add New Feature to Existing Module
1. Check role requirements (who can access?)
2. Add DB columns/tables via migration if needed
3. Update middleware.ts if new routes
4. Create component in `components/{module}/`
5. Wire up in page component with data fetching

### Debug Auth Issues
1. Check middleware.ts logs (role checks happen here)
2. Verify profile exists: `SELECT * FROM profiles WHERE id = auth.uid()`
3. Check RLS policies on affected tables
4. Test with known test user credentials

## External Dependencies

- **Twilio**: Call center phone/SMS (env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
- **Supabase**: Auth, DB, Storage, Realtime (env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
- **Vercel**: Deployment platform (runs `npm run build`)

## Reference Documentation

- Full docs (Spanish): [README_ES.md](../README_ES.md)
- Project index: [PROJECT_INDEX.md](../PROJECT_INDEX.md)
- Call Center setup: [CALL_CENTER_README.md](../CALL_CENTER_README.md)
- Test credentials: [TEST_USERS_CREDENTIALS.md](../TEST_USERS_CREDENTIALS.md)
