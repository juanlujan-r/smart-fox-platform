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

  RAISE NOTICE 'Team hierarchy reorganized successfully';
END $$;

-- Show results
SELECT 
  lob_name,
  role,
  COUNT(*) as count
FROM public.profiles
GROUP BY lob_name, role
ORDER BY lob_name, role DESC;
