/* ========================================================================
   POPULATE COMPREHENSIVE USER DATA
   Date: 2026-02-07
   Description: Fill profiles with complete RH, identification, medical,
   bank, and schedule information for all test users
   ======================================================================== */

-- ============================================================================
-- 1. UPDATE PROFILES WITH COMPLETE DATA
-- ============================================================================

-- Gerente: gerente1@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Carlos Germán Rodríguez Martínez',
  document_id = '1085632147',
  document_type = 'CC',
  hiring_date = '2024-01-15',
  contract_type = 'Indefinido',
  base_salary = 5500000,
  personal_data = jsonb_build_object(
    'email', 'gerente1@smartfox.com',
    'phone', '+57 300 123 4567',
    'address', 'Cra 45 #32-87 Piso 5',
    'city', 'Bogotá',
    'emergency_name', 'María Rodríguez López',
    'emergency_phone', '+57 300 987 6543',
    'birth_date', '1982-08-15',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Sura',
    'arl', 'Seguros Bolívar',
    'blood_type', 'O+',
    'allergies', 'Sin alergias conocidas',
    'pension', 'Porvenir'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'L',
    'pants', '34',
    'shoes', '10'
  ),
  bank_account = jsonb_build_object(
    'account_number', '4560123456789012',
    'bank_name', 'Banco de Bogotá',
    'ach_code', '012',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'gerente1@smartfox.com');

-- Supervisor 1: supervisor1@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'José Miguel Sánchez Díaz',
  document_id = '1089456123',
  document_type = 'CC',
  hiring_date = '2024-02-20',
  contract_type = 'Indefinido',
  base_salary = 3200000,
  personal_data = jsonb_build_object(
    'email', 'supervisor1@smartfox.com',
    'phone', '+57 301 245 6789',
    'address', 'Cra 12 #78-45 Apt 203',
    'city', 'Bogotá',
    'emergency_name', 'Ana Sánchez Gómez',
    'emergency_phone', '+57 301 654 8902',
    'birth_date', '1985-03-22',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'EPS Sanitas',
    'arl', 'Sura',
    'blood_type', 'A+',
    'allergies', 'Penicilina',
    'pension', 'AFP Integra'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'M',
    'pants', '32',
    'shoes', '9'
  ),
  bank_account = jsonb_build_object(
    'account_number', '5321098765432109',
    'bank_name', 'Bancolombia',
    'ach_code', '019',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'supervisor1@smartfox.com');

-- Supervisor 2: supervisor2@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Laura Patricia Gutierrez Ramírez',
  document_id = '1083721945',
  document_type = 'CC',
  hiring_date = '2024-02-20',
  contract_type = 'Indefinido',
  base_salary = 3200000,
  personal_data = jsonb_build_object(
    'email', 'supervisor2@smartfox.com',
    'phone', '+57 302 567 1234',
    'address', 'Cra 88 #12-34 Apt 501',
    'city', 'Bogotá',
    'emergency_name', 'Pedro Gutierrez López',
    'emergency_phone', '+57 302 876 5432',
    'birth_date', '1988-11-05',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Coomeva',
    'arl', 'Seguros Bolívar',
    'blood_type', 'B-',
    'allergies', 'Lactosa',
    'pension', 'AFP Capital'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'S',
    'pants', '26',
    'shoes', '6'
  ),
  bank_account = jsonb_build_object(
    'account_number', '6789012345678901',
    'bank_name', 'BBVA',
    'ach_code', '023',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'supervisor2@smartfox.com');

-- Employee 1: emp1@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'David Fernando Morales Castillo',
  document_id = '1087654321',
  document_type = 'CC',
  hiring_date = '2024-03-10',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp1@smartfox.com',
    'phone', '+57 303 789 2345',
    'address', 'Cra 25 #55-67 Apt 102',
    'city', 'Bogotá',
    'emergency_name', 'Rosa Castillo Martínez',
    'emergency_phone', '+57 303 234 5678',
    'birth_date', '1995-06-18',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Alianza',
    'arl', 'Suracorp',
    'blood_type', 'O-',
    'allergies', 'Sin alergias',
    'pension', 'Profuturo'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'M',
    'pants', '30',
    'shoes', '8'
  ),
  bank_account = jsonb_build_object(
    'account_number', '9876543210987654',
    'bank_name', 'Davivienda',
    'ach_code', '051',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp1@smartfox.com');

-- Employee 2: emp2@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Stephanie Nova García López',
  document_id = '1086543219',
  document_type = 'CC',
  hiring_date = '2024-03-12',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp2@smartfox.com',
    'phone', '+57 304 901 2345',
    'address', 'Cra 50 #22-11 Apt 304',
    'city', 'Bogotá',
    'emergency_name', 'Carlos García Sánchez',
    'emergency_phone', '+57 304 567 8901',
    'birth_date', '1993-09-24',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'EPS Sanitas',
    'arl', 'Sura',
    'blood_type', 'AB+',
    'allergies', 'Sulfonamidas',
    'pension', 'Integra'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'XS',
    'pants', '24',
    'shoes', '5'
  ),
  bank_account = jsonb_build_object(
    'account_number', '2345678901234567',
    'bank_name', 'Banco de Bogotá',
    'ach_code', '012',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp2@smartfox.com');

-- Employee 3: emp3@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Andrés Felipe Mendoza Ruiz',
  document_id = '1081234567',
  document_type = 'CC',
  hiring_date = '2024-03-15',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp3@smartfox.com',
    'phone', '+57 305 123 4567',
    'address', 'Cra 7 #89-10 Apt 701',
    'city', 'Bogotá',
    'emergency_name', 'Gloria Ruiz González',
    'emergency_phone', '+57 305 876 5432',
    'birth_date', '1990-01-30',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Coomeva',
    'arl', 'Seguros Bolívar',
    'blood_type', 'A-',
    'allergies', 'Aspirina',
    'pension', 'Old Mutual'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'L',
    'pants', '34',
    'shoes', '11'
  ),
  bank_account = jsonb_build_object(
    'account_number', '8765432109876543',
    'bank_name', 'Scotiabank',
    'ach_code', '091',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp3@smartfox.com');

-- Employee 4: emp4@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Valentina Salazar Peña',
  document_id = '1084567890',
  document_type = 'CC',
  hiring_date = '2024-03-18',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp4@smartfox.com',
    'phone', '+57 306 456 7890',
    'address', 'Cra 60 #45-23 Apt 1502',
    'city', 'Bogotá',
    'emergency_name', 'Roberto Peña Ortiz',
    'emergency_phone', '+57 306 234 5678',
    'birth_date', '1996-07-11',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Alianza',
    'arl', 'Suracorp',
    'blood_type', 'B+',
    'allergies', 'Nueces',
    'pension', 'Profuturo'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'S',
    'pants', '28',
    'shoes', '7'
  ),
  bank_account = jsonb_build_object(
    'account_number', '3456789012345678',
    'bank_name', 'Bancolombia',
    'ach_code', '019',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp4@smartfox.com');

-- Employee 5: emp5@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Marco Antonio López Jiménez',
  document_id = '1088765432',
  document_type = 'CC',
  hiring_date = '2024-03-20',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp5@smartfox.com',
    'phone', '+57 307 789 0123',
    'address', 'Cra 15 #65-34 Apt 805',
    'city', 'Bogotá',
    'emergency_name', 'Marta Jiménez Flores',
    'emergency_phone', '+57 307 456 7890',
    'birth_date', '1991-04-05',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'EPS Sanitas',
    'arl', 'Sura',
    'blood_type', 'O+',
    'allergies', 'Antibióticos aminoglucósidos',
    'pension', 'AFP Integra'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'XL',
    'pants', '36',
    'shoes', '12'
  ),
  bank_account = jsonb_build_object(
    'account_number', '5432109876543210',
    'bank_name', 'BBVA',
    'ach_code', '023',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp5@smartfox.com');

-- Employee 6: emp6@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Camila Sofía Rodríguez Vélez',
  document_id = '1089876543',
  document_type = 'CC',
  hiring_date = '2024-03-22',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp6@smartfox.com',
    'phone', '+57 308 012 3456',
    'address', 'Cra 35 #78-90 Apt 1102',
    'city', 'Bogotá',
    'emergency_name', 'Jesús Vélez Moreno',
    'emergency_phone', '+57 308 789 0123',
    'birth_date', '1997-12-14',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Coomeva',
    'arl', 'Seguros Bolívar',
    'blood_type', 'AB-',
    'allergies', 'Mariscos',
    'pension', 'AFP Capital'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'S',
    'pants', '26',
    'shoes', '6'
  ),
  bank_account = jsonb_build_object(
    'account_number', '7654321098765432',
    'bank_name', 'Davivienda',
    'ach_code', '051',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp6@smartfox.com');

-- Employee 7: emp7@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Ricardo Alejandro Hernández Silva',
  document_id = '1082109876',
  document_type = 'CC',
  hiring_date = '2024-03-25',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp7@smartfox.com',
    'phone', '+57 309 234 5678',
    'address', 'Cra 72 #34-56 Apt 609',
    'city', 'Bogotá',
    'emergency_name', 'Iris Silva García',
    'emergency_phone', '+57 309 567 8901',
    'birth_date', '1989-05-19',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Alianza',
    'arl', 'Suracorp',
    'blood_type', 'B-',
    'allergies', 'Cefalosporinas',
    'pension', 'Porvenir'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'L',
    'pants', '32',
    'shoes', '9'
  ),
  bank_account = jsonb_build_object(
    'account_number', '1234567890123456',
    'bank_name', 'Banco de Bogotá',
    'ach_code', '012',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp7@smartfox.com');

-- Employee 8: emp8@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Michelle Alejandra Cortés Díaz',
  document_id = '1085432109',
  document_type = 'CC',
  hiring_date = '2024-03-28',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp8@smartfox.com',
    'phone', '+57 310 456 7890',
    'address', 'Cra 95 #56-78 Apt 2003',
    'city', 'Bogotá',
    'emergency_name', 'Antonio Díaz López',
    'emergency_phone', '+57 310 789 0123',
    'birth_date', '1994-08-27',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'EPS Sanitas',
    'arl', 'Sura',
    'blood_type', 'O+',
    'allergies', 'Sulfonamidas',
    'pension', 'AFP Integra'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'XS',
    'pants', '24',
    'shoes', '5'
  ),
  bank_account = jsonb_build_object(
    'account_number', '9012345678901234',
    'bank_name', 'Bancolombia',
    'ach_code', '019',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp8@smartfox.com');

-- Employee 9: emp9@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Javier Eduardo García Martínez',
  document_id = '1083456789',
  document_type = 'CC',
  hiring_date = '2024-03-30',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp9@smartfox.com',
    'phone', '+57 311 678 9012',
    'address', 'Cra 42 #89-01 Apt 1304',
    'city', 'Bogotá',
    'emergency_name', 'Paula Martínez Rossi',
    'emergency_phone', '+57 311 234 5678',
    'birth_date', '1992-10-08',
    'gender', 'M'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Coomeva',
    'arl', 'Seguros Bolívar',
    'blood_type', 'A+',
    'allergies', 'AINES',
    'pension', 'AFP Capital'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'M',
    'pants', '32',
    'shoes', '10'
  ),
  bank_account = jsonb_build_object(
    'account_number', '4567890123456789',
    'bank_name', 'BBVA',
    'ach_code', '023',
    'account_type', 'Ahorros'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp9@smartfox.com');

-- Employee 10: emp10@smartfox.com
UPDATE public.profiles
SET 
  full_name = 'Daniela Patricia González Morales',
  document_id = '1087890123',
  document_type = 'CC',
  hiring_date = '2024-04-01',
  contract_type = 'Indefinido',
  base_salary = 1450000,
  personal_data = jsonb_build_object(
    'email', 'emp10@smartfox.com',
    'phone', '+57 312 890 1234',
    'address', 'Cra 18 #23-45 Apt 902',
    'city', 'Bogotá',
    'emergency_name', 'Fernando Morales Soto',
    'emergency_phone', '+57 312 567 8901',
    'birth_date', '1998-02-16',
    'gender', 'F'
  ),
  medical_data = jsonb_build_object(
    'eps', 'Alianza',
    'arl', 'Suracorp',
    'blood_type', 'B+',
    'allergies', 'Gluten',
    'pension', 'Profuturo'
  ),
  sizes_data = jsonb_build_object(
    'shirt', 'S',
    'pants', '28',
    'shoes', '6'
  ),
  bank_account = jsonb_build_object(
    'account_number', '8901234567890123',
    'bank_name', 'Davivienda',
    'ach_code', '051',
    'account_type', 'Corriente'
  )
WHERE id = (SELECT id FROM auth.users WHERE email = 'emp10@smartfox.com');

-- ============================================================================
-- 2. CREATE SCHEDULES FOR ALL USERS (Lunes a Viernes, 8am-5pm)
-- ============================================================================

-- Generate schedules for next 30 days for all test users
WITH RECURSIVE dates AS (
  SELECT CURRENT_DATE + INTERVAL '1 day' as date
  UNION ALL
  SELECT date + INTERVAL '1 day'
  FROM dates
  WHERE date < CURRENT_DATE + INTERVAL '30 days'
),
weekdays AS (
  SELECT date FROM dates
  WHERE EXTRACT(DOW FROM date) NOT IN (0, 6) -- Exclude Sundays and Saturdays
),
test_users AS (
  SELECT id FROM auth.users 
  WHERE email IN (
    'gerente1@smartfox.com',
    'supervisor1@smartfox.com',
    'supervisor2@smartfox.com',
    'emp1@smartfox.com',
    'emp2@smartfox.com',
    'emp3@smartfox.com',
    'emp4@smartfox.com',
    'emp5@smartfox.com',
    'emp6@smartfox.com',
    'emp7@smartfox.com',
    'emp8@smartfox.com',
    'emp9@smartfox.com',
    'emp10@smartfox.com'
  )
)
INSERT INTO public.schedules (user_id, shift_start, shift_end, created_at)
SELECT 
  u.id,
  make_timestamp(
    EXTRACT(YEAR FROM w.date)::int,
    EXTRACT(MONTH FROM w.date)::int,
    EXTRACT(DAY FROM w.date)::int,
    8, 0, 0
  ) AT TIME ZONE 'America/Bogota' AT TIME ZONE 'UTC',
  make_timestamp(
    EXTRACT(YEAR FROM w.date)::int,
    EXTRACT(MONTH FROM w.date)::int,
    EXTRACT(DAY FROM w.date)::int,
    17, 0, 0
  ) AT TIME ZONE 'America/Bogota' AT TIME ZONE 'UTC',
  NOW()
FROM test_users u
CROSS JOIN weekdays w
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. CREATE SAMPLE ATTENDANCE LOGS (Past week)
-- ============================================================================

WITH test_users AS (
  SELECT id, email FROM auth.users 
  WHERE email IN (
    'gerente1@smartfox.com',
    'supervisor1@smartfox.com',
    'supervisor2@smartfox.com',
    'emp1@smartfox.com',
    'emp2@smartfox.com',
    'emp3@smartfox.com',
    'emp4@smartfox.com',
    'emp5@smartfox.com',
    'emp6@smartfox.com',
    'emp7@smartfox.com',
    'emp8@smartfox.com',
    'emp9@smartfox.com',
    'emp10@smartfox.com'
  )
),
log_events AS (
  SELECT 
    u.id,
    (ARRAY['entrada', 'descanso', 'almuerzo', 'reunion', 'offline'])[((x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 5) + 1] as state,
    (ARRAY['Oficina Principal', 'Oficina Remota', 'Sitio del Cliente'])[((x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 3) + 1] as location,
    make_timestamp(
      2026,
      2,
      EXTRACT(DAY FROM '2026-02-06'::date - (INTERVAL '1 day' * x.n))::int,
      (8 + x.n)::int,
      (RANDOM() * 59)::int,
      0
    ) as created_at,
    CASE 
      WHEN (x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 5 = 0 THEN 'Trabajando normalmente'
      WHEN (x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 5 = 1 THEN 'Descanso'
      WHEN (x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 5 = 2 THEN 'Almuerzo'
      WHEN (x.n + ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY u.id)) % 5 = 3 THEN 'Reunión con gerencia'
      ELSE 'Registrado'
    END as notes
  FROM test_users u
  CROSS JOIN LATERAL (SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) x
)
INSERT INTO public.attendance_logs (user_id, state, location, notes, created_at)
SELECT id, state, location, notes, created_at
FROM log_events
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'Usuarios de prueba completados con todos los datos de RH, identificación, horarios y registros de asistencia';
