-- Script para resetear contraseñas de usuarios de prueba a "Test1234!"
-- Ejecuta este script en Supabase SQL Editor o con: npx supabase db push

-- Hash de contraseña bcrypt válido para: Test1234!
-- Generado: 2026-02-07

DO $$
BEGIN
  -- supervisor1@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$1yn1K.7/X5ATTltJXI.Lt.HsILkGT6EHU3LveVzrRglMYSMEKXB6C'::text
  WHERE email = 'supervisor1@smartfox.com';
  
  -- supervisor2@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$DV/1vtrpS2Yb85WqfpYxyOzVVauFaKFlrYPomuzIcqF.BmkWGa5g.'::text
  WHERE email = 'supervisor2@smartfox.com';
  
  -- emp1@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$FnmNpMB5mf6P31H.4N.o4eAIlelBJbXw5QelXFkpeir69mMDRdp5K'::text
  WHERE email = 'emp1@smartfox.com';
  
  -- emp2@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$pWE49iGsc2EU4M1iJeUM/eN/TBDHy3lQ650ZUYDvBkECkNwbrrUJu'::text
  WHERE email = 'emp2@smartfox.com';
  
  -- emp3@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$V/3uWIMLBtKBir7b5AVl4u8mFuHJO2xoibDaCXbM4VcJBTrvoy52.'::text
  WHERE email = 'emp3@smartfox.com';
  
  -- emp4@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$NYBsLjmpPhScCOmFdBHCwOs0JfxtlLS.FxKw07S9YpI6J0343tip6'::text
  WHERE email = 'emp4@smartfox.com';
  
  -- emp5@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$/hMu/Hu9UkMFObVO8u6Sa.pehJPozG41vsTmArQ7bkMb2Ko0LOJga'::text
  WHERE email = 'emp5@smartfox.com';
  
  -- emp6@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$XZOQ5vAgD8i.hBxpW3ONYedyaIzXtD8CmpaYeRHaq2YHPxHQG4baa'::text
  WHERE email = 'emp6@smartfox.com';
  
  -- emp7@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$T1B8WeRyNSXKu.alAfwz8.dvVwtta9AxVniUEe5SDUv/AfNsqkAMu'::text
  WHERE email = 'emp7@smartfox.com';
  
  -- emp8@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$szmzkF0Em4ldnJeXaVQA3.e0busyEaomyWjOl78Mt89O6eIkEbQF.'::text
  WHERE email = 'emp8@smartfox.com';
  
  -- emp9@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$NJA9He2oXoootLJoWAhBSOsikzm7qP4ISgOYEUkEcUa1ni1.hq1Vi'::text
  WHERE email = 'emp9@smartfox.com';
  
  -- emp10@smartfox.com - password: Test1234!
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$62k5AYoAiARGK8SW82ypS.6IgvoqbM2sWRNcCdeuQElsd.pmKD3BO'::text
  WHERE email = 'emp10@smartfox.com';
  
  -- gerente1@smartfox.com - password: Test1234! (ya existente)
  UPDATE auth.users 
  SET encrypted_password = '$2a$10$lKi0oRrGMdCvmxd.tXUDc.PGaTfjfqAFS7RMe/dsCiZBPbaFp0B6O'::text
  WHERE email = 'gerente1@smartfox.com';

  RAISE NOTICE 'Contraseñas actualizadas para todos los usuarios de prueba';
END $$;

-- Verificar que se actualizaron
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email LIKE '%@smartfox.com%'
ORDER BY email;
