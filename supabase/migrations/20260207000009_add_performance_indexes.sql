-- Add missing indexes for frequently queried columns
-- This improves query performance for common operations

-- Attendance logs - Used in HR management and metrics
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_created 
  ON attendance_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_state 
  ON attendance_logs(user_id, state) 
  WHERE state IS NOT NULL;

-- HR Requests - Used in approvals and employee details
CREATE INDEX IF NOT EXISTS idx_hr_requests_user_status 
  ON hr_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_hr_requests_status_created 
  ON hr_requests(status, created_at DESC);

-- Schedules - Used in schedule management and dashboard
CREATE INDEX IF NOT EXISTS idx_schedules_user_date 
  ON schedules(user_id, scheduled_date);

-- Index for future schedules only (without WHERE clause to avoid IMMUTABLE error)
CREATE INDEX IF NOT EXISTS idx_schedules_date 
  ON schedules(scheduled_date DESC);

-- Disciplinary actions - Used in employee metrics
CREATE INDEX IF NOT EXISTS idx_disciplinary_user_created 
  ON disciplinary_actions(user_id, created_at DESC);

-- Call records - Used in call center and metrics
CREATE INDEX IF NOT EXISTS idx_call_records_agent_created 
  ON call_records(agent_id, created_at DESC) 
  WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_call_records_status 
  ON call_records(call_status, created_at DESC);

-- Profiles - Used for hierarchical queries
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor 
  ON profiles(supervisor_id) 
  WHERE supervisor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON profiles(role);

-- CRM Contacts - Used in call center
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone 
  ON crm_contacts(phone_number);

-- Analyze tables to update statistics
ANALYZE attendance_logs;
ANALYZE hr_requests;
ANALYZE schedules;
ANALYZE disciplinary_actions;
ANALYZE call_records;
ANALYZE profiles;
ANALYZE crm_contacts;
