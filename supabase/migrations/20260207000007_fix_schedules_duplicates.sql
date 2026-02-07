-- Fix schedule duplicates before adding unique constraint
-- Date: 2026-02-07

-- Delete duplicate schedules, keeping only the latest one for each user_id, scheduled_date combination
DELETE FROM public.schedules
WHERE id NOT IN (
  SELECT MAX(id)
  FROM public.schedules
  GROUP BY user_id, scheduled_date
);

-- Now add the unique constraint
ALTER TABLE public.schedules
ADD CONSTRAINT unique_user_scheduled_date UNIQUE (user_id, scheduled_date);
