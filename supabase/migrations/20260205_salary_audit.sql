-- Create salary audit table to track changes
CREATE TABLE IF NOT EXISTS salary_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  changed_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  old_salary DECIMAL(12,2),
  new_salary DECIMAL(12,2) NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS salary_audit_employee_idx ON salary_audit(employee_id);
CREATE INDEX IF NOT EXISTS salary_audit_changed_by_idx ON salary_audit(changed_by_id);
CREATE INDEX IF NOT EXISTS salary_audit_created_at_idx ON salary_audit(created_at);

-- Enable RLS
ALTER TABLE salary_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only gerentes can view all, supervisors can view their team
CREATE POLICY "salary_audit_read_policy" ON salary_audit
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gerente'
      ) OR
      EXISTS (
        SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'supervisor'
      )
    )
  );

-- RLS Policy: Only gerentes can insert
CREATE POLICY "salary_audit_insert_policy" ON salary_audit
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'gerente'
    )
  );
