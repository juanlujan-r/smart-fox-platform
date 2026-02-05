-- Migration: Add notes and location columns to attendance_logs table
-- Description: Extend attendance_logs schema to support optional notes and location tracking

ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_created 
  ON attendance_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_type 
  ON attendance_logs(type);
