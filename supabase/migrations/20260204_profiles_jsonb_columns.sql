-- Migration: Add JSONB columns to profiles for Smart Fox ERP profile page
-- Stores: personal_data, medical_data, academic_data, sizes_data

-- Ensure profiles table exists (common with Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'empleado',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add JSONB columns for profile sections
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS academic_data JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sizes_data JSONB DEFAULT '{}';

-- RLS: users can read and update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow insert on signup (e.g. from trigger) - optional
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
