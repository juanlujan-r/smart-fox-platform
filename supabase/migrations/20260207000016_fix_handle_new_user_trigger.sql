/* ==========================================================================
   SMART FOX SOLUTIONS - FIX NEW USER TRIGGER
   Date: 2026-02-07
   Description: Update handle_new_user() trigger to respect role from metadata
   instead of hardcoding 'empleado' for all new users
   ========================================================================== */

-- Drop and recreate the trigger function to respect role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'empleado')  -- Use role from metadata, default to empleado
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger (already exists, but ensuring it's properly attached)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile for new users, respecting role from raw_user_meta_data or defaulting to empleado';
