/* ==========================================================================
   SMART FOX SOLUTIONS - CREATE GERENTE USER
   Date: 2026-02-07
   Description: Create gerente1@smartfox.com user in auth.users
   Password: Test1234!
   ========================================================================== */

-- Insert or update gerente1 user (idempotent)
DO $$
DECLARE
  user_exists BOOLEAN;
  existing_user_id UUID;
BEGIN
  -- Check if user exists and get their ID
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'gerente1@smartfox.com';
  user_exists := FOUND;
  
  IF NOT user_exists THEN
    -- Create gerente1 user if doesn't exist (for local dev)
    INSERT INTO auth.users (
      id, 
      instance_id, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_user_meta_data, 
      raw_app_meta_data, 
      created_at, 
      updated_at,
      role,
      aud,
      confirmation_token,
      recovery_token,
      email_change_token_new
    ) 
    VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid,
      'gerente1@smartfox.com',
      '$2a$10$1yn1K.7/X5ATTltJXI.Lt.HsILkGT6EHU3LveVzrRglMYSMEKXB6C'::text,
      now(),
      '{"role": "gerente", "full_name": "Carlos Germán Rodríguez Martínez", "email_verified": true}'::jsonb,
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    );
    existing_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
    RAISE NOTICE 'Gerente1 user created with ID: %', existing_user_id;
  ELSE
    -- Update password and metadata for existing user
    UPDATE auth.users
    SET encrypted_password = '$2a$10$1yn1K.7/X5ATTltJXI.Lt.HsILkGT6EHU3LveVzrRglMYSMEKXB6C'::text,
        email_confirmed_at = now(),
        raw_user_meta_data = jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{role}',
          '"gerente"'::jsonb
        )
    WHERE email = 'gerente1@smartfox.com';
    RAISE NOTICE 'Gerente1 user updated with ID: %', existing_user_id;
  END IF;

-- Ensure profile exists for gerente1 (use actual user ID)
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    existing_user_id,
    'gerente',
    'Carlos Germán Rodríguez Martínez'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'gerente',
      full_name = 'Carlos Germán Rodríguez Martínez';

  RAISE NOTICE 'Gerente1 profile ensured for user ID: %', existing_user_id;
END;
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'gerente1@smartfox.com';
  RAISE NOTICE 'Total gerente1 users: %', user_count;
END;
$$;
