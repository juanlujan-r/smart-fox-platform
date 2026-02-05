-- Schedules: assigned shifts per user per day (for calendar and check-in comparison)
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, scheduled_date)
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_date ON schedules(user_id, scheduled_date);

-- RLS: users see and manage their own schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own schedules" ON schedules;
CREATE POLICY "Users can read own schedules" ON schedules
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;
CREATE POLICY "Users can insert own schedules" ON schedules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own schedules" ON schedules;
CREATE POLICY "Users can update own schedules" ON schedules
  FOR UPDATE USING (auth.uid() = user_id);

-- Shift exchange requests (for "Solicitar Cambio de Turno")
CREATE TABLE IF NOT EXISTS shift_exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  requested_date DATE NOT NULL,
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shift_exchange_user ON shift_exchange_requests(user_id);

ALTER TABLE shift_exchange_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own shift requests" ON shift_exchange_requests;
CREATE POLICY "Users can read own shift requests" ON shift_exchange_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shift requests" ON shift_exchange_requests;
CREATE POLICY "Users can insert own shift requests" ON shift_exchange_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
