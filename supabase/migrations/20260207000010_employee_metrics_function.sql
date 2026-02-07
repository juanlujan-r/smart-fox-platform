-- Create function to get employee metrics in a single query
-- This replaces multiple separate queries with one database call
-- Significantly improves performance by reducing N+1 query problem

CREATE OR REPLACE FUNCTION get_employee_metrics(employee_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  total_connections INT;
  last_connection TIMESTAMP;
  total_call_time INT;
  total_permissions INT;
  pending_permissions INT;
  employee_cargo TEXT;
  supervisor_name TEXT;
BEGIN
  -- Get connection metrics from attendance_logs
  SELECT 
    COUNT(*),
    MAX(created_at)
  INTO 
    total_connections,
    last_connection
  FROM attendance_logs
  WHERE user_id = employee_id;

  -- Get call time from call_records  
  SELECT COALESCE(SUM(duration_seconds), 0)
  INTO total_call_time
  FROM call_records
  WHERE agent_id = (SELECT id FROM call_center_agents WHERE user_id = employee_id LIMIT 1);

  -- Get permissions metrics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pendiente')
  INTO 
    total_permissions,
    pending_permissions
  FROM hr_requests
  WHERE user_id = employee_id
    AND type IN ('permiso', 'licencia', 'vacaciones');

  -- Get employee cargo and supervisor name
  SELECT 
    p.cargo,
    s.full_name
  INTO 
    employee_cargo,
    supervisor_name
  FROM profiles p
  LEFT JOIN profiles s ON p.supervisor_id = s.id
  WHERE p.id = employee_id;

  -- Build JSON result with all data
  result := json_build_object(
    'totalConnections', COALESCE(total_connections, 0),
    'lastConnection', last_connection,
    'totalCallTime', COALESCE(total_call_time, 0),
    'totalPermissions', COALESCE(total_permissions, 0),
    'pendingPermissions', COALESCE(pending_permissions, 0),
    'cargo', employee_cargo,
    'supervisorName', supervisor_name,
    'disciplinaryActions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'type', type,
          'description', description,
          'created_by', created_by,
          'created_at', created_at,
          'expires_at', expires_at
        ) ORDER BY created_at DESC
      ), '[]'::json)
      FROM disciplinary_actions
      WHERE user_id = employee_id
    ),
    'schedules', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'scheduled_date', scheduled_date,
          'start_time', start_time,
          'end_time', end_time,
          'shift_type', shift_type
        ) ORDER BY scheduled_date DESC
      ), '[]'::json)
      FROM schedules
      WHERE user_id = employee_id
      ORDER BY scheduled_date DESC
      LIMIT 30
    ),
    'pendingPermissionsList', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'type', type,
          'title', title,
          'status', status,
          'start_date', start_date,
          'end_date', end_date,
          'created_at', created_at
        ) ORDER BY created_at DESC
      ), '[]'::json)
      FROM hr_requests
      WHERE user_id = employee_id
        AND status = 'pendiente'
        AND type IN ('permiso', 'licencia', 'vacaciones')
    ),
    'attendanceLogs', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', id,
          'state', state,
          'type', type,
          'created_at', created_at,
          'updated_at', updated_at
        ) ORDER BY created_at DESC
      ), '[]'::json)
      FROM (
        SELECT * FROM attendance_logs
        WHERE user_id = employee_id
        ORDER BY created_at DESC
        LIMIT 50
      ) logs
    )
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_metrics(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_employee_metrics IS 
  'Returns comprehensive employee metrics in a single query to avoid N+1 problem';
