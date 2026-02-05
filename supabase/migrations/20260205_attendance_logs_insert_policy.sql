-- Add INSERT policy for attendance_logs so users can log their shifts
-- This is critical for ShiftControl.tsx to work properly

-- Users can insert their own attendance logs
DROP POLICY IF EXISTS "Users can insert own attendance_logs" ON attendance_logs;
CREATE POLICY "Users can insert own attendance_logs" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance logs (optional, for corrections)
DROP POLICY IF EXISTS "Users can update own attendance_logs" ON attendance_logs;
CREATE POLICY "Users can update own attendance_logs" ON attendance_logs
  FOR UPDATE USING (auth.uid() = user_id);
