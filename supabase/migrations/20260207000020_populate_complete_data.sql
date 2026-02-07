/* ==========================================================================
   SMART FOX SOLUTIONS - COMPLETE USER DATA POPULATION
   Date: 2026-02-07
   Description: Assign positions, organize teams, fill missing data, add January schedules
   ========================================================================== */

-- ============================================================================
-- 1. ASSIGN POSITIONS BASED ON ROLES
-- ============================================================================

-- Gerente → Gerente de Cuenta
UPDATE public.profiles
SET cargo = 'Gerente de Cuenta'
WHERE role = 'gerente' AND (cargo IS NULL OR cargo = '');

-- Supervisors → Líder de Equipo
UPDATE public.profiles
SET cargo = 'Líder de Equipo'
WHERE role = 'supervisor' AND (cargo IS NULL OR cargo = '');

-- Empleados → Agente
UPDATE public.profiles
SET cargo = 'Agente'
WHERE role = 'empleado' AND (cargo IS NULL OR cargo = '');

-- ============================================================================
-- 2. ORGANIZE TEAM HIERARCHY - LOB STRUCTURE
-- ============================================================================

DO $$
DECLARE
  gerente_id uuid;
  supervisor1_id uuid;
  supervisor2_id uuid;
  emp_ids uuid[];
  i integer := 1;
BEGIN
  -- Get IDs
  SELECT id INTO gerente_id FROM auth.users WHERE email = 'gerente1@smartfox.com';
  SELECT id INTO supervisor1_id FROM auth.users WHERE email = 'supervisor1@smartfox.com';
  SELECT id INTO supervisor2_id FROM auth.users WHERE email = 'supervisor2@smartfox.com';

  -- Assign LOB and manager to supervisors
  UPDATE public.profiles
  SET lob_name = 'LOB1',
      manager_id = gerente_id
  WHERE id = supervisor1_id;

  UPDATE public.profiles
  SET lob_name = 'LOB2',
      manager_id = gerente_id
  WHERE id = supervisor2_id;

  -- Assign gerente
  UPDATE public.profiles
  SET lob_name = 'LOB1'
  WHERE id = gerente_id;

  -- Get all employee IDs
  SELECT array_agg(id) INTO emp_ids
  FROM public.profiles
  WHERE role = 'empleado';

  -- Assign first 5 employees to LOB1/Supervisor1
  FOR i IN 1..LEAST(5, array_length(emp_ids, 1)) LOOP
    UPDATE public.profiles
    SET lob_name = 'LOB1',
        team_lead_id = supervisor1_id,
        manager_id = gerente_id
    WHERE id = emp_ids[i];
  END LOOP;

  -- Assign remaining employees to LOB2/Supervisor2
  FOR i IN 6..array_length(emp_ids, 1) LOOP
    UPDATE public.profiles
    SET lob_name = 'LOB2',
        team_lead_id = supervisor2_id,
        manager_id = gerente_id
    WHERE id = emp_ids[i];
  END LOOP;

  RAISE NOTICE 'Team hierarchy organized successfully';
END $$;

-- ============================================================================
-- 3. FILL MISSING PERSONAL DATA FOR ALL USERS
-- ============================================================================

-- Update profiles with complete personal_data
UPDATE public.profiles p
SET personal_data = jsonb_build_object(
  'email', u.email,
  'phone', '+57 ' || (300 + (random() * 20)::int) || ' ' || (100 + (random() * 900)::int) || ' ' || (1000 + (random() * 9000)::int),
  'address', 'Cra ' || (10 + (random() * 90)::int) || ' #' || (10 + (random() * 90)::int) || '-' || (10 + (random() * 90)::int),
  'city', CASE 
    WHEN random() < 0.7 THEN 'Bogotá'
    WHEN random() < 0.85 THEN 'Medellín'
    ELSE 'Cali'
  END,
  'emergency_name', split_part(p.full_name, ' ', 1) || ' Familiar',
  'emergency_phone', '+57 ' || (300 + (random() * 20)::int) || ' ' || (100 + (random() * 900)::int) || ' ' || (1000 + (random() * 9000)::int),
  'birth_date', (DATE '1980-01-01' + (random() * 10000)::int)::text,
  'gender', CASE WHEN random() < 0.5 THEN 'M' ELSE 'F' END
),
medical_data = jsonb_build_object(
  'eps', CASE 
    WHEN random() < 0.3 THEN 'Sura'
    WHEN random() < 0.6 THEN 'Sanitas'
    ELSE 'Nueva EPS'
  END,
  'arl', CASE 
    WHEN random() < 0.5 THEN 'Seguros Bolívar'
    ELSE 'Sura ARL'
  END,
  'blood_type', CASE 
    WHEN random() < 0.25 THEN 'O+'
    WHEN random() < 0.5 THEN 'A+'
    WHEN random() < 0.75 THEN 'B+'
    ELSE 'AB+'
  END,
  'allergies', 'Ninguna conocida',
  'pension', CASE 
    WHEN random() < 0.5 THEN 'Porvenir'
    ELSE 'Protección'
  END
),
sizes_data = jsonb_build_object(
  'shirt', CASE 
    WHEN random() < 0.3 THEN 'S'
    WHEN random() < 0.7 THEN 'M'
    ELSE 'L'
  END,
  'pants', (28 + (random() * 10)::int)::text,
  'shoes', (7 + (random() * 5)::int)::text
),
bank_account = jsonb_build_object(
  'account_number', (4000000000000000::bigint + (random() * 1000000000000000)::bigint)::text,
  'bank_name', CASE 
    WHEN random() < 0.3 THEN 'Bancolombia'
    WHEN random() < 0.6 THEN 'Banco de Bogotá'
    ELSE 'Davivienda'
  END,
  'ach_code', CASE 
    WHEN random() < 0.3 THEN '007'
    WHEN random() < 0.6 THEN '001'
    ELSE '051'
  END,
  'account_type', CASE 
    WHEN random() < 0.5 THEN 'Ahorros'
    ELSE 'Corriente'
  END
),
document_id = CASE 
  WHEN p.document_id IS NULL OR p.document_id = '' 
  THEN (1000000000 + (random() * 90000000)::int)::text
  ELSE p.document_id
END,
document_type = 'CC',
hiring_date = CASE 
  WHEN p.hiring_date IS NULL 
  THEN (DATE '2023-01-01' + (random() * 700)::int)
  ELSE p.hiring_date
END,
contract_type = 'Indefinido'
FROM auth.users u
WHERE p.id = u.id 
AND (
  p.personal_data IS NULL 
  OR p.medical_data IS NULL 
  OR p.sizes_data IS NULL 
  OR p.bank_account IS NULL
  OR p.document_id IS NULL
  OR p.hiring_date IS NULL
);

-- ============================================================================
-- 4. CREATE JANUARY 2026 SCHEDULES FOR ALL EMPLOYEES
-- ============================================================================

DO $$
DECLARE
  emp_record RECORD;
  day_date DATE;
  is_weekend BOOLEAN;
BEGIN
  -- Loop through all employees and supervisors
  FOR emp_record IN 
    SELECT id, full_name FROM public.profiles 
    WHERE role IN ('empleado', 'supervisor')
  LOOP
    -- Loop through all days in January 2026
    FOR day_date IN 
      SELECT generate_series(
        DATE '2026-01-01', 
        DATE '2026-01-31', 
        INTERVAL '1 day'
      )::DATE
    LOOP
      is_weekend := EXTRACT(DOW FROM day_date) IN (0, 6); -- Sunday or Saturday

      --Continue only if weekday
      IF NOT is_weekend THEN
        -- Insert schedule (only if not exists)
        INSERT INTO public.schedules (
          user_id,
          scheduled_date,
          shift_start,
          shift_end,
          created_at
        )
        SELECT
          emp_record.id,
          day_date,
          (day_date + interval '8 hours')::timestamptz,
          (day_date + interval '18 hours')::timestamptz,
          NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM public.schedules
          WHERE user_id = emp_record.id AND scheduled_date = day_date
        );
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'January 2026 schedules created for all employees';
END $$;

-- ============================================================================
-- FINAL STATISTICS
-- ============================================================================

DO $$
DECLARE
  total_users int;
  total_gerentes int;
  total_supervisors int;
  total_employees int;
  lob1_count int;
  lob2_count int;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO total_gerentes FROM public.profiles WHERE role = 'gerente';
  SELECT COUNT(*) INTO total_supervisors FROM public.profiles WHERE role = 'supervisor';
  SELECT COUNT(*) INTO total_employees FROM public.profiles WHERE role = 'empleado';
  SELECT COUNT(*) INTO lob1_count FROM public.profiles WHERE lob_name = 'LOB1';
  SELECT COUNT(*) INTO lob2_count FROM public.profiles WHERE lob_name = 'LOB2';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATA POPULATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Users: %', total_users;
  RAISE NOTICE 'Gerentes: %', total_gerentes;
  RAISE NOTICE 'Supervisors: %', total_supervisors;
  RAISE NOTICE 'Employees: %', total_employees;
  RAISE NOTICE '--------------------------------------------';
  RAISE NOTICE 'LOB1 Team: %', lob1_count;
  RAISE NOTICE 'LOB2 Team: %', lob2_count;
  RAISE NOTICE '============================================';
END $$;
