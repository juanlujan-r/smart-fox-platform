/* ==========================================================================
   SMART FOX SOLUTIONS - ADD MISSING TEST USERS
   Date: 2026-02-07
   Description: Add missing test users (supervisor1, supervisor2, emp1-10)
                gerente1 already exists in remote database
   ========================================================================== */

-- Insert missing test users
DO $$
BEGIN
  -- Insert supervisor and employee users (12 users total)
  -- Use INSERT ... WHERE NOT EXISTS to avoid conflicts
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at
  ) 
  SELECT 
    '02a7cc3a-dcb0-459d-a831-559f93f43dcf'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'supervisor1@smartfox.com', 
    '$2a$10$1yn1K.7/X5ATTltJXI.Lt.HsILkGT6EHU3LveVzrRglMYSMEKXB6C'::text, 
    now(), '{"role": "supervisor", "full_name": "Maria Gonzalez", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor1@smartfox.com')
  UNION ALL
  SELECT 
    '8d385ceb-1c15-4b45-b02f-3c31f5beffd5'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'supervisor2@smartfox.com', 
    '$2a$10$DV/1vtrpS2Yb85WqfpYxyOzVVauFaKFlrYPomuzIcqF.BmkWGa5g.'::text, 
    now(), '{"role": "supervisor", "full_name": "Juan Lopez", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'supervisor2@smartfox.com')
  UNION ALL
  SELECT 
    '632de64d-ae24-43c8-a3ed-e9bc14538ed3'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp1@smartfox.com', 
    '$2a$10$FnmNpMB5mf6P31H.4N.o4eAIlelBJbXw5QelXFkpeir69mMDRdp5K'::text, 
    now(), '{"role": "empleado", "full_name": "Ana Martinez", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp1@smartfox.com')
  UNION ALL
  SELECT 
    '5e632bdd-fe16-4f65-9a77-993043c622aa'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp2@smartfox.com', 
    '$2a$10$pWE49iGsc2EU4M1iJeUM/eN/TBDHy3lQ650ZUYDvBkECkNwbrrUJu'::text, 
    now(), '{"role": "empleado", "full_name": "Diego Fernandez", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp2@smartfox.com')
  UNION ALL
  SELECT 
    'bd63206b-287f-457d-ba11-8398b997adcf'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp3@smartfox.com', 
    '$2a$10$V/3uWIMLBtKBir7b5AVl4u8mFuHJO2xoibDaCXbM4VcJBTrvoy52.'::text, 
    now(), '{"role": "empleado", "full_name": "Laura Jimenez", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp3@smartfox.com')
  UNION ALL
  SELECT 
    '554dca70-fc41-4354-901e-1d45a1e8296d'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp4@smartfox.com', 
    '$2a$10$NYBsLjmpPhScCOmFdBHCwOs0JfxtlLS.FxKw07S9YpI6J0343tip6'::text, 
    now(), '{"role": "empleado", "full_name": "Miguel Torres", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp4@smartfox.com')
  UNION ALL
  SELECT 
    'b680a51b-ef04-4e90-8962-76b9782ee594'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp5@smartfox.com', 
    '$2a$10$/hMu/Hu9UkMFObVO8u6Sa.pehJPozG41vsTmArQ7bkMb2Ko0LOJga'::text, 
    now(), '{"role": "empleado", "full_name": "Sofia Cruz", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp5@smartfox.com')
  UNION ALL
  SELECT 
    '934ad44a-e1dc-4435-847f-6d178033959c'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp6@smartfox.com', 
    '$2a$10$XZOQ5vAgD8i.hBxpW3ONYedyaIzXtD8CmpaYeRHaq2YHPxHQG4baa'::text, 
    now(), '{"role": "empleado", "full_name": "Fernando Reyes", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp6@smartfox.com')
  UNION ALL
  SELECT 
    '3304af08-799b-433f-beee-1f6377c11462'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp7@smartfox.com', 
    '$2a$10$T1B8WeRyNSXKu.alAfwz8.dvVwtta9AxVniUEe5SDUv/AfNsqkAMu'::text, 
    now(), '{"role": "empleado", "full_name": "Gabriela Mendoza", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp7@smartfox.com')
  UNION ALL
  SELECT 
    '1f56efdb-98f4-4b6e-a6bd-919ec322c4b8'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp8@smartfox.com', 
    '$2a$10$szmzkF0Em4ldnJeXaVQA3.e0busyEaomyWjOl78Mt89O6eIkEbQF.'::text, 
    now(), '{"role": "empleado", "full_name": "Julio Herrera", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp8@smartfox.com')
  UNION ALL
  SELECT 
    'ac91e1f4-d4fb-4e48-a716-0ceab63dae11'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp9@smartfox.com', 
    '$2a$10$NJA9He2oXoootLJoWAhBSOsikzm7qP4ISgOYEUkEcUa1ni1.hq1Vi'::text, 
    now(), '{"role": "empleado", "full_name": "Valentina Salazar", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp9@smartfox.com')
  UNION ALL
  SELECT 
    '14c7ef65-27d7-42bf-8ce2-bc2d307d6bbc'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'emp10@smartfox.com', 
    '$2a$10$62k5AYoAiARGK8SW82ypS.6IgvoqbM2sWRNcCdeuQElsd.pmKD3BO'::text, 
    now(), '{"role": "empleado", "full_name": "Andres Moreno", "email_verified": true}'::jsonb, 
    '{"provider": "email", "providers": ["email"]}'::jsonb, now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp10@smartfox.com');

  -- Insert corresponding auth.identities for each user
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) 
  SELECT 
    '3be8cf11-9a53-45bc-aaea-627803a335f8'::uuid, '02a7cc3a-dcb0-459d-a831-559f93f43dcf'::text, '02a7cc3a-dcb0-459d-a831-559f93f43dcf'::uuid, 
    '{"sub": "02a7cc3a-dcb0-459d-a831-559f93f43dcf", "email": "supervisor1@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '02a7cc3a-dcb0-459d-a831-559f93f43dcf'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    'fd2740fc-9d09-4efa-8221-82bec226076c'::uuid, '8d385ceb-1c15-4b45-b02f-3c31f5beffd5'::text, '8d385ceb-1c15-4b45-b02f-3c31f5beffd5'::uuid, 
    '{"sub": "8d385ceb-1c15-4b45-b02f-3c31f5beffd5", "email": "supervisor2@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '8d385ceb-1c15-4b45-b02f-3c31f5beffd5'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    'ae23abea-f88b-496c-a792-1997c68e2408'::uuid, '632de64d-ae24-43c8-a3ed-e9bc14538ed3'::text, '632de64d-ae24-43c8-a3ed-e9bc14538ed3'::uuid, 
    '{"sub": "632de64d-ae24-43c8-a3ed-e9bc14538ed3", "email": "emp1@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '632de64d-ae24-43c8-a3ed-e9bc14538ed3'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    'ea6a5540-7706-4ee5-956f-10e4f88395e3'::uuid, '5e632bdd-fe16-4f65-9a77-993043c622aa'::text, '5e632bdd-fe16-4f65-9a77-993043c622aa'::uuid, 
    '{"sub": "5e632bdd-fe16-4f65-9a77-993043c622aa", "email": "emp2@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '5e632bdd-fe16-4f65-9a77-993043c622aa'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '83da1c2e-eb7c-4c0a-ad92-43201d2e5baa'::uuid, 'bd63206b-287f-457d-ba11-8398b997adcf'::text, 'bd63206b-287f-457d-ba11-8398b997adcf'::uuid, 
    '{"sub": "bd63206b-287f-457d-ba11-8398b997adcf", "email": "emp3@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'bd63206b-287f-457d-ba11-8398b997adcf'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '40ec989e-7ddc-420f-8816-268fd9bdb30b'::uuid, '554dca70-fc41-4354-901e-1d45a1e8296d'::text, '554dca70-fc41-4354-901e-1d45a1e8296d'::uuid, 
    '{"sub": "554dca70-fc41-4354-901e-1d45a1e8296d", "email": "emp4@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '554dca70-fc41-4354-901e-1d45a1e8296d'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '2441446e-bf1a-4ce1-879e-2e3e1a06c609'::uuid, 'b680a51b-ef04-4e90-8962-76b9782ee594'::text, 'b680a51b-ef04-4e90-8962-76b9782ee594'::uuid, 
    '{"sub": "b680a51b-ef04-4e90-8962-76b9782ee594", "email": "emp5@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b680a51b-ef04-4e90-8962-76b9782ee594'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '3e35f67e-6812-41b8-9b50-7ac91e46b85f'::uuid, '934ad44a-e1dc-4435-847f-6d178033959c'::text, '934ad44a-e1dc-4435-847f-6d178033959c'::uuid, 
    '{"sub": "934ad44a-e1dc-4435-847f-6d178033959c", "email": "emp6@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '934ad44a-e1dc-4435-847f-6d178033959c'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '53a19999-5af3-4651-b261-ec12b05e3093'::uuid, '3304af08-799b-433f-beee-1f6377c11462'::text, '3304af08-799b-433f-beee-1f6377c11462'::uuid, 
    '{"sub": "3304af08-799b-433f-beee-1f6377c11462", "email": "emp7@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '3304af08-799b-433f-beee-1f6377c11462'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '6a12762c-0281-4b80-bcb2-70ae8f095b19'::uuid, '1f56efdb-98f4-4b6e-a6bd-919ec322c4b8'::text, '1f56efdb-98f4-4b6e-a6bd-919ec322c4b8'::uuid, 
    '{"sub": "1f56efdb-98f4-4b6e-a6bd-919ec322c4b8", "email": "emp8@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '1f56efdb-98f4-4b6e-a6bd-919ec322c4b8'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    'be3ba416-5521-41c6-baf3-cce39487f88f'::uuid, 'ac91e1f4-d4fb-4e48-a716-0ceab63dae11'::text, 'ac91e1f4-d4fb-4e48-a716-0ceab63dae11'::uuid, 
    '{"sub": "ac91e1f4-d4fb-4e48-a716-0ceab63dae11", "email": "emp9@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'ac91e1f4-d4fb-4e48-a716-0ceab63dae11'::uuid AND provider = 'email')
  UNION ALL
  SELECT 
    '3780d971-20d5-424a-be1f-0994185176ce'::uuid, '14c7ef65-27d7-42bf-8ce2-bc2d307d6bbc'::text, '14c7ef65-27d7-42bf-8ce2-bc2d307d6bbc'::uuid, 
    '{"sub": "14c7ef65-27d7-42bf-8ce2-bc2d307d6bbc", "email": "emp10@smartfox.com", "email_verified": false, "phone_verified": false}'::jsonb, 
    'email', now(), now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = '14c7ef65-27d7-42bf-8ce2-bc2d307d6bbc'::uuid AND provider = 'email');

END $$
