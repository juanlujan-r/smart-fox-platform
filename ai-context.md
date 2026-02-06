# Smart Fox - Reglas de Desarrollo
- **Stack:** Next.js 15 (App Router), Supabase, Tailwind 4, Docker (Local).
- **Seguridad DB:** Las funciones de PostgreSQL DEBEN usar `SECURITY DEFINER` y `SET search_path = public` para evitar recursion en RLS.
  - Nunca usar `SELECT *` en triggers.
- **Login & Auth:** El acceso se basa en el campo `role` de la tabla `profiles`.
  - Si un usuario no tiene perfil, el sistema debe fallar con gracia.
- **Optimizacion:**
  - Evitar loops infinitos en `useEffect` y triggers de SQL.
  - Los tipos de datos deben ser validados con el archivo `src/types/database.ts`.
