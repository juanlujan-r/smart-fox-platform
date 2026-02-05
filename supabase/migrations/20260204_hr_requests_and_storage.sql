-- HR Requests table (Reportar / Solicitar)
CREATE TABLE IF NOT EXISTS hr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('permiso', 'licencia', 'novedad', 'vacaciones', 'incapacidad')),
  details TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  attachment_url TEXT   -- storage path (e.g. user_id/filename); use signed URL when opening
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_requests_user ON hr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_requests_created ON hr_requests(created_at DESC);

ALTER TABLE hr_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own requests
DROP POLICY IF EXISTS "Users can read own hr_requests" ON hr_requests;
CREATE POLICY "Users can read own hr_requests" ON hr_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own requests (critical for "Reportar/Solicitar")
DROP POLICY IF EXISTS "Users can insert own hr_requests" ON hr_requests;
CREATE POLICY "Users can insert own hr_requests" ON hr_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own requests (before supervisor approval)
DROP POLICY IF EXISTS "Users can update own hr_requests" ON hr_requests;
CREATE POLICY "Users can update own hr_requests" ON hr_requests
  FOR UPDATE USING (auth.uid() = user_id);


-- Storage bucket for HR attachments (PDF/Images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-attachments', 'hr-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to hr-attachments (path: user_id/filename)
DROP POLICY IF EXISTS "Authenticated upload to hr-attachments" ON storage.objects;
CREATE POLICY "Authenticated upload to hr-attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hr-attachments');

-- Allow authenticated users to read from hr-attachments (for "Ver adjunto")
DROP POLICY IF EXISTS "Authenticated read hr-attachments" ON storage.objects;
CREATE POLICY "Authenticated read hr-attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'hr-attachments');
