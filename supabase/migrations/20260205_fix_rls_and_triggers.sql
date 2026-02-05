/* ==========================================================================
   SMART FOX SOLUTIONS - RLS AND PERMISSION FIXES
   Date: 2026-02-05
   Purpose: Fix RLS policies - use check_is_admin() to avoid recursion
   STATUS: ALL RECURSIVE EXISTS() QUERIES REPLACED WITH check_is_admin()
   ========================================================================== */

-- NOTE: Use this file OR 20260205_complete_schema.sql
-- 20260205_complete_schema.sql is the recommended master schema file
-- This file keeps the individual fixes for reference

-- All policies now use public.check_is_admin() which is SECURITY DEFINER
-- This prevents infinite recursion that was causing "infinite recursion detected in policy"

-- To deploy: Copy the content of 20260205_complete_schema.sql to Supabase SQL Editor

-- ========================================================================== */
