/* ==========================================================================
   SMART FOX SOLUTIONS - SIMPLIFY BONUSES SYSTEM
   Date: 2026-02-07
   Description: Simplify bonuses to be for next payment date only
   - Remove start_date/end_date range concept
   - Add payment_date for single payment
   - Remove unused status values
   - Make amount/percentage mutually exclusive
   ========================================================================== */

-- 1. Add payment_date column and make old columns nullable
ALTER TABLE public.performance_bonuses
ADD COLUMN IF NOT EXISTS payment_date date;

-- 2. Copy start_date to payment_date for existing records
UPDATE public.performance_bonuses
SET payment_date = start_date
WHERE payment_date IS NULL;

-- 3. Make payment_date NOT NULL after copying data
ALTER TABLE public.performance_bonuses
ALTER COLUMN payment_date SET NOT NULL;

-- 4. Make start_date and end_date nullable (they'll be deprecated)
ALTER TABLE public.performance_bonuses
ALTER COLUMN start_date DROP NOT NULL;

-- 5. Update check constraint for simpler status
ALTER TABLE public.performance_bonuses
DROP CONSTRAINT IF EXISTS performance_bonuses_status_check;

ALTER TABLE public.performance_bonuses
ADD CONSTRAINT performance_bonuses_status_check
CHECK (status IN ('pending', 'paid', 'cancelled'));

-- 6. Update status values for existing records
UPDATE public.performance_bonuses
SET status = CASE
  WHEN status = 'active' THEN 'pending'
  WHEN status = 'expired' THEN 'cancelled'
  WHEN status = 'rolled_back' THEN 'cancelled'
  ELSE 'pending'
END;

-- 7. Add index for payment_date queries
CREATE INDEX IF NOT EXISTS idx_performance_bonuses_payment_date 
ON public.performance_bonuses(payment_date);

-- 8. Add index for pending bonuses
CREATE INDEX IF NOT EXISTS idx_performance_bonuses_pending 
ON public.performance_bonuses(status, payment_date) 
WHERE status = 'pending';

-- 9. Add comment for documentation
COMMENT ON COLUMN public.performance_bonuses.payment_date IS 
'Date when bonus will be paid (next payroll date). Bonuses are one-time payments.';

COMMENT ON COLUMN public.performance_bonuses.amount IS 
'Fixed amount bonus in COP. Use this OR percentage, not both.';

COMMENT ON COLUMN public.performance_bonuses.percentage IS 
'Percentage of base salary. Use this OR amount, not both.';
