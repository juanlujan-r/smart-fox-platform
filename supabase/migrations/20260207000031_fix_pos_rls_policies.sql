/* ========================================================================
   FIX CRITICAL: CORRECCIÓN RLS MÓDULO POS
   Date: 2026-02-07
   CTO: SmartFox Solutions
   
   PROBLEMA DETECTADO:
   - Las tablas products, orders, order_items, categories tienen políticas
     "PUBLIC" que permiten acceso anónimo sin autenticación
   - RIESGO: Cualquier persona puede leer/insertar datos en POS
   
   SOLUCIÓN:
   - Restringir acceso solo a usuarios autenticados
   - Solo gerentes pueden administrar productos/categorías
   - Empleados/supervisores pueden crear órdenes
   ======================================================================== */

-- ============================================================================
-- 1. ELIMINAR POLÍTICAS INSEGURAS
-- ============================================================================

DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert items" ON public.order_items;

-- ============================================================================
-- 2. PRODUCTS - SOLO GERENTES ADMINISTRAN, TODOS LOS AUTH PUEDEN VER
-- ============================================================================

CREATE POLICY "authenticated_users_read_products" ON public.products
FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "managers_manage_products" ON public.products
FOR ALL TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 3. CATEGORIES - SOLO GERENTES ADMINISTRAN, TODOS LOS AUTH PUEDEN VER
-- ============================================================================

CREATE POLICY "authenticated_users_read_categories" ON public.categories
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "managers_manage_categories" ON public.categories
FOR ALL TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 4. ORDERS - EMPLEADOS/SUPERVISORES/GERENTES PUEDEN CREAR
-- ============================================================================

CREATE POLICY "authenticated_create_orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_view_orders" ON public.orders
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "managers_manage_orders" ON public.orders
FOR ALL TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 5. ORDER_ITEMS - VINCULADOS A ORDERS
-- ============================================================================

CREATE POLICY "authenticated_create_order_items" ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_view_order_items" ON public.order_items
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "managers_manage_order_items" ON public.order_items
FOR ALL TO authenticated
USING (public.check_is_admin())
WITH CHECK (public.check_is_admin());

-- ============================================================================
-- 6. AUDITORÍA
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS Policies Fixed for POS Module: products, categories, orders, order_items';
  RAISE NOTICE 'Security Level: Upgraded from PUBLIC to AUTHENTICATED';
END $$;

COMMENT ON TABLE public.products IS 'POS Products - RLS enabled. Only authenticated users can access.';
COMMENT ON TABLE public.categories IS 'Product Categories - RLS enabled. Only authenticated users can access.';
COMMENT ON TABLE public.orders IS 'Sales Orders - RLS enabled. Only authenticated users can create.';
COMMENT ON TABLE public.order_items IS 'Order Line Items - RLS enabled. Only authenticated users can create.';
