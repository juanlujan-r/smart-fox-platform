/* ==========================================================================
   SMART FOX SOLUTIONS - ADD BANKING AND EMAIL FIELDS
   Date: 2026-02-05
   Purpose: Add email and banking information to profiles
   ========================================================================== */

-- ============================================================================
-- 1. UPDATE PERSONAL_DATA TO INCLUDE EMAIL
-- ============================================================================

-- Update existing personal_data to include email field if missing
UPDATE public.profiles 
SET personal_data = jsonb_set(
  COALESCE(personal_data, '{}'::jsonb),
  '{email}',
  '""'::jsonb
)
WHERE personal_data->>'email' IS NULL;

-- ============================================================================
-- 2. ADD BANK_ACCOUNT JSONB COLUMN
-- ============================================================================

ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS bank_account jsonb DEFAULT '{
  "account_number": "",
  "bank_name": "",
  "ach_code": "",
  "account_type": ""
}'::jsonb;

-- ============================================================================
-- 3. BANK REFERENCE DATA (for application use)
-- ========================================================================== 

-- List of Colombian banks with ACH codes (stored in application, not DB)
-- Banco,ACH Code
-- Bancolombia,1007
-- Banco de Bogotá (Grupo Aval),1001
-- Davivienda,1051
-- BBVA Colombia,1013
-- Banco de Occidente (Grupo Aval),1023
-- Banco AV Villas (Grupo Aval),1052
-- Banco Popular (Grupo Aval),1002
-- Scotiabank Colpatria,1019
-- Itaú,1014
-- Banco GNB Sudameris,1012
-- Banco Caja Social,1032
-- Banco Agrario,1040

-- ============================================================================
-- END OF MIGRATION
-- ========================================================================== */
