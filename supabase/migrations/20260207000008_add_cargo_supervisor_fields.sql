-- Add cargo (job title) and supervisor_id fields to profiles table

ALTER TABLE profiles 
ADD COLUMN cargo TEXT,
ADD COLUMN supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for supervisor lookups
CREATE INDEX idx_profiles_supervisor_id ON profiles(supervisor_id);

-- Create unique index for preventing duplicate supervisor assignments
CREATE INDEX idx_profiles_role_supervisor ON profiles(supervisor_id) WHERE supervisor_id IS NOT NULL;
