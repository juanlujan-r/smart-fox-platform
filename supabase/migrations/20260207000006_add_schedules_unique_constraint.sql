-- Add unique constraint to schedules table for better data management
-- Date: 2026-02-07

-- Check if the constraint already exists and create it if it doesn't
ALTER TABLE public.schedules
ADD CONSTRAINT unique_user_scheduled_date UNIQUE (user_id, scheduled_date);

COMMENT ON CONSTRAINT unique_user_scheduled_date ON public.schedules 
IS 'Ensures one schedule per user per day';

