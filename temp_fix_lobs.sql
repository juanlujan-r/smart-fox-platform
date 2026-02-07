-- Fix LOB assignments
DO $$
DECLARE
  gerente_id uuid;
  supervisor1_id uuid;
  supervisor2_id uuid;
  emp_ids uuid[];
  i integer;
BEGIN
  -- Get IDs
  SELECT id INTO gerente_id FROM auth.users WHERE email = 'gerente1@smartfox.com';
  SELECT id INTO supervisor1_id FROM auth.users WHERE email = 'supervisor1@smartfox.com';
  SELECT id INTO supervisor2_id FROM auth.users WHERE email = 'supervisor2@smartfox.com';

  -- Assign gerente to LOB1
  UPDATE public.profiles
  SET lob_name = 'LOB1',
      team_lead_id = NULL,
      manager_id = NULL
  WHERE id = gerente_id;

  -- Assign supervisor1 to LOB1
  UPDATE public.profiles
  SET lob_name = 'LOB1',
      team_lead_id = NULL,
      manager_id = gerente_id
  WHERE id = supervisor1_id;

  -- Assign supervisor2 to LOB2
  UPDATE public.profiles
  SET lob_name = 'LOB2',
      team_lead_id = NULL,
      manager_id = gerente_id
  WHERE id = supervisor2_id;

  -- Get all employee IDs ordered
  SELECT array_agg(id ORDER BY full_name) INTO emp_ids
  FROM public.profiles
  WHERE role = 'empleado';

  -- Assign first 5 employees to LOB1/Supervisor1
  FOR i IN 1..5 LOOP
    IF i <= array_length(emp_ids, 1) THEN
      UPDATE public.profiles
      SET lob_name = 'LOB1',
          team_lead_id = supervisor1_id,
          manager_id = gerente_id
      WHERE id = emp_ids[i];
    END IF;
  END LOOP;

  -- Assign remaining employees to LOB2/Supervisor2
  FOR i IN 6..array_length(emp_ids, 1) LOOP
    UPDATE public.profiles
    SET lob_name = 'LOB2',
        team_lead_id = supervisor2_id,
        manager_id = gerente_id
    WHERE id = emp_ids[i];
  END LOOP;

  RAISE NOTICE 'LOB teams reorganized correctly';
END $$;

-- Show final distribution
SELECT 
  lob_name,
  role,
  cargo,
  COUNT(*) as count
FROM public.profiles
GROUP BY lob_name, role, cargo
ORDER BY lob_name, role DESC;
