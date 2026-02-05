-- Add break_start and break_end columns to schedules table
ALTER TABLE schedules 
ADD COLUMN IF NOT EXISTS break_start TIME,
ADD COLUMN IF NOT EXISTS break_end TIME;
