-- INSTRUCCIONES PARA EJECUTAR MIGRACIONES Y LLENAR BASE DE DATOS
-- Sigue estos pasos en orden:

-- 1. Abre Supabase SQL Editor: https://supabase.com/dashboard/project/[YOUR-PROJECT]/sql
-- 2. Copia cada bloque SQL y ejecuta uno por uno
-- 3. Si alguno falla, verifica el error y ajusta según sea necesario

-- =====================================================
-- PASO 1: Crear tabla salary_audit
-- =====================================================
-- Ejecuta el contenido de: supabase/migrations/20260205_salary_audit.sql

-- =====================================================
-- PASO 2: Llenar BD con empleados y attendance logs
-- =====================================================
-- Ejecuta el contenido de: supabase/migrations/20260205_seed_test_data.sql

-- =====================================================
-- PASO 3: Verificar que los datos se insertaron correctamente
-- =====================================================

-- Ver empleados insertados:
SELECT id, full_name, role, base_salary, minute_rate FROM profiles 
WHERE email LIKE '%smartfox.local%' 
ORDER BY role, full_name;

-- Ver attendance logs (últimos 15 días):
SELECT COUNT(*) as total_logs, user_id 
FROM attendance_logs 
WHERE created_at >= NOW() - INTERVAL '15 days'
GROUP BY user_id 
ORDER BY total_logs DESC;

-- Ver auditazgo de salarios:
SELECT * FROM salary_audit ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- DATOS A INSERTAR:
-- =====================================================
-- Gerentes (2):
--   - Carlos Rodríguez (gerente1@smartfox.local) - $5,000,000/mes
--   - María González (gerente2@smartfox.local) - $4,800,000/mes

-- Supervisores (3):
--   - Juan López (supervisor1@smartfox.local) - $2,500,000/mes
--   - Patricia Sánchez (supervisor2@smartfox.local) - $2,500,000/mes
--   - Roberto García (supervisor3@smartfox.local) - $2,400,000/mes

-- Empleados (10):
--   1. Ana Martínez (emp1@smartfox.local) - $1,200,000/mes
--   2. Diego Fernández (emp2@smartfox.local) - $1,200,000/mes
--   3. Laura Jiménez (emp3@smartfox.local) - $1,250,000/mes
--   4. Miguel Torres (emp4@smartfox.local) - $1,200,000/mes
--   5. Sofía Cruz (emp5@smartfox.local) - $1,300,000/mes
--   6. Fernando Reyes (emp6@smartfox.local) - $1,200,000/mes
--   7. Gabriela Mendoza (emp7@smartfox.local) - $1,250,000/mes
--   8. Julio Herrera (emp8@smartfox.local) - $1,200,000/mes
--   9. Valentina Salazar (emp9@smartfox.local) - $1,300,000/mes
--   10. Andrés Moreno (emp10@smartfox.local) - $1,200,000/mes

-- =====================================================
-- USO EN LA APLICACIÓN:
-- =====================================================

-- 1. ACTUALIZAR SALARIOS (solo gerentes):
--    - Ir a HR Management → Gestión de Salarios
--    - Hacer clic en el salario del empleado
--    - Se pedirá contraseña del gerente
--    - Se registrará en salary_audit

-- 2. GENERAR NÓMINA:
--    - Ir a HR Management → Generador de Nómina
--    - Seleccionar fecha inicio y fin (últimos 15 días tienen datos)
--    - Ver previsualización de cálculos
--    - Descargar como Excel

-- 3. VER HISTORIAL DE CAMBIOS:
--    - Crear una tabla salary_history para mostrar cambios (futuro)
