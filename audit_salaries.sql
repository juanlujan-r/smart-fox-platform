/* ========================================================================
   AUDITORÍA DE SALARIOS Y MINUTE_RATE
   CTO SmartFox Solutions - 2026-02-07
   ======================================================================== */

-- 1. Verificar cálculo de minute_rate (debe ser base_salary / 12600)
SELECT 
  email,
  full_name,
  role,
  base_salary,
  minute_rate AS minute_rate_actual,
  ROUND((base_salary / 12600.0)::numeric, 2) AS minute_rate_esperado,
  CASE 
    WHEN minute_rate IS NULL THEN '❌ NULL'
    WHEN ABS(minute_rate - (base_salary / 12600.0)) > 0.01 THEN '⚠️ DESCUADRE'
    ELSE '✅ OK'
  END AS status
FROM auth.users 
JOIN public.profiles ON auth.users.id = public.profiles.id 
WHERE role IN ('empleado', 'supervisor', 'gerente')
ORDER BY role DESC, base_salary DESC;

-- 2. Verificar salarios en 0 o NULL
SELECT 
  email,
  full_name,
  role,
  base_salary,
  minute_rate,
  hiring_date
FROM auth.users 
JOIN public.profiles ON auth.users.id = public.profiles.id 
WHERE (base_salary IS NULL OR base_salary = 0)
  AND role IN ('empleado', 'supervisor', 'gerente')
ORDER BY role DESC;

-- 3. Estadísticas por rol
SELECT 
  role,
  COUNT(*) AS total_usuarios,
  COUNT(CASE WHEN base_salary > 0 THEN 1 END) AS con_salario,
  COUNT(CASE WHEN minute_rate > 0 THEN 1 END) AS con_minute_rate,
  ROUND(AVG(base_salary)::numeric, 0) AS salario_promedio,
  ROUND(AVG(minute_rate)::numeric, 2) AS minute_rate_promedio
FROM public.profiles
WHERE role IN ('empleado', 'supervisor', 'gerente')
GROUP BY role
ORDER BY role DESC;
