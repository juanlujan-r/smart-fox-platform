-- Seed data: Create test users and attendance logs for the last 15 days
-- This inserts directly into profiles table (assumes users already exist in auth)
-- If you need to create auth users first, use Supabase dashboard or create a separate script

-- Insert test employee profiles (if they don't exist)
INSERT INTO profiles (id, email, full_name, role, base_salary, minute_rate, document_id, personal_data)
VALUES 
  -- Gerentes (2)
  ('00000000-0000-0000-0000-000000000001', 'gerente1@smartfox.local', 'Carlos Rodríguez', 'gerente', 5000000, 5952.38, '1001001', NULL),
  ('00000000-0000-0000-0000-000000000002', 'gerente2@smartfox.local', 'María González', 'gerente', 4800000, 5714.29, '1001002', NULL),
  
  -- Supervisores (3)
  ('00000000-0000-0000-0000-000000000003', 'supervisor1@smartfox.local', 'Juan López', 'supervisor', 2500000, 2976.19, '1002001', NULL),
  ('00000000-0000-0000-0000-000000000004', 'supervisor2@smartfox.local', 'Patricia Sánchez', 'supervisor', 2500000, 2976.19, '1002002', NULL),
  ('00000000-0000-0000-0000-000000000005', 'supervisor3@smartfox.local', 'Roberto García', 'supervisor', 2400000, 2857.14, '1002003', NULL),
  
  -- Empleados (10)
  ('00000000-0000-0000-0000-000000000011', 'emp1@smartfox.local', 'Ana Martínez', 'empleado', 1200000, 1428.57, '1100001', NULL),
  ('00000000-0000-0000-0000-000000000012', 'emp2@smartfox.local', 'Diego Fernández', 'empleado', 1200000, 1428.57, '1100002', NULL),
  ('00000000-0000-0000-0000-000000000013', 'emp3@smartfox.local', 'Laura Jiménez', 'empleado', 1250000, 1488.10, '1100003', NULL),
  ('00000000-0000-0000-0000-000000000014', 'emp4@smartfox.local', 'Miguel Torres', 'empleado', 1200000, 1428.57, '1100004', NULL),
  ('00000000-0000-0000-0000-000000000015', 'emp5@smartfox.local', 'Sofía Cruz', 'empleado', 1300000, 1547.62, '1100005', NULL),
  ('00000000-0000-0000-0000-000000000016', 'emp6@smartfox.local', 'Fernando Reyes', 'empleado', 1200000, 1428.57, '1100006', NULL),
  ('00000000-0000-0000-0000-000000000017', 'emp7@smartfox.local', 'Gabriela Mendoza', 'empleado', 1250000, 1488.10, '1100007', NULL),
  ('00000000-0000-0000-0000-000000000018', 'emp8@smartfox.local', 'Julio Herrera', 'empleado', 1200000, 1428.57, '1100008', NULL),
  ('00000000-0000-0000-0000-000000000019', 'emp9@smartfox.local', 'Valentina Salazar', 'empleado', 1300000, 1547.62, '1100009', NULL),
  ('00000000-0000-0000-0000-000000000020', 'emp10@smartfox.local', 'Andrés Moreno', 'empleado', 1200000, 1428.57, '1100010', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert attendance logs for the last 15 days
-- For each employee, we'll create 2-3 entrada/salida pairs per workday
DO $$ 
DECLARE
  emp_id UUID;
  start_date DATE := CURRENT_DATE - INTERVAL '15 days';
  current_date DATE := start_date;
  emp_ids UUID[] := ARRAY[
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000015',
    '00000000-0000-0000-0000-000000000016',
    '00000000-0000-0000-0000-000000000017',
    '00000000-0000-0000-0000-000000000018',
    '00000000-0000-0000-0000-000000000019',
    '00000000-0000-0000-0000-000000000020'
  ];
  start_time TIME;
  end_time TIME;
  break_start TIME;
  break_end TIME;
BEGIN
  WHILE current_date <= CURRENT_DATE LOOP
    -- Skip weekends (Saturday = 6, Sunday = 0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      FOREACH emp_id IN ARRAY emp_ids LOOP
        -- Entrada morning (8:00 AM + random 0-30 minutes)
        start_time := '08:00'::TIME + (RANDOM() * INTERVAL '30 minutes');
        
        -- Break (12:00 - 13:00)
        break_start := '12:00'::TIME;
        break_end := '13:00'::TIME;
        
        -- Salida afternoon (5:00 PM + random -30 to +30 minutes)
        end_time := '17:00'::TIME + ((RANDOM() - 0.5) * INTERVAL '60 minutes');
        
        -- Insert entrada morning
        INSERT INTO attendance_logs (user_id, state, created_at, estimated_break_start, estimated_break_end)
        VALUES (
          emp_id,
          'entrada',
          current_date AT TIME ZONE 'America/Bogota' + start_time::INTERVAL,
          break_start,
          break_end
        ) ON CONFLICT DO NOTHING;
        
        -- Insert break return (reunion state)
        INSERT INTO attendance_logs (user_id, state, created_at, estimated_break_start, estimated_break_end)
        VALUES (
          emp_id,
          'reunion',
          current_date AT TIME ZONE 'America/Bogota' + break_end::INTERVAL,
          break_start,
          break_end
        ) ON CONFLICT DO NOTHING;
        
        -- Insert salida afternoon
        INSERT INTO attendance_logs (user_id, state, created_at)
        VALUES (
          emp_id,
          'salida',
          current_date AT TIME ZONE 'America/Bogota' + end_time::INTERVAL
        ) ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
END $$;
