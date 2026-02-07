'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import ShiftControl from '@/components/hr/ShiftControl';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';

export default function Dashboard() {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [workHours, setWorkHours] = useState(0);
  const [latestState, setLatestState] = useState<string>('offline');
  const [latestStateAt, setLatestStateAt] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [scheduledStart, setScheduledStart] = useState<string | null>(null);
  const [scheduledEnd, setScheduledEnd] = useState<string | null>(null);
  const [actualWorkMinutes, setActualWorkMinutes] = useState(0);
  const [scheduledMinutes, setScheduledMinutes] = useState(0);

  const currentDate = format(new Date(), 'MMMM d, yyyy');

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Fetch authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Full Error Details:', JSON.stringify(authError, null, 2));
          setLoading(false);
          return;
        }

        if (!user || !user.id) {
          console.error('No authenticated user found');
          setLoading(false);
          return;
        }

        setSessionVerified(true);

        // Attempt to fetch user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, personal_data')
          .eq('id', user.id)
          .single();

        // Extract name from profile or auth metadata
        const fullName = profile?.personal_data?.fullName || 
                        user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        'Usuario';
        
        setEmployeeName(fullName);

        // Handle profile fetch error
        if (error) {
          console.error('Full Error Details:', JSON.stringify(error, null, 2));
          
          // Auto-provisioning: If profile doesn't exist, create one
          if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
            console.log('Profile not found. Attempting auto-provisioning...');
            
            const fullName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'Unknown User';

            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: user.id,
                  role: 'empleado',
                  personal_data: {
                    fullName: fullName
                  }
                }
              ])
              .select('role')
              .single();

            if (insertError) {
              console.error('Auto-provisioning failed:', JSON.stringify(insertError, null, 2));
              setUserRole('empleado'); // Default fallback
            } else {
              console.log('Auto-provisioning successful');
              setUserRole(newProfile?.role || 'empleado');
            }
          } else {
            // Other errors - use default role
            setUserRole('empleado');
          }
        } else {
          // Profile exists
          setUserRole(profile?.role || 'empleado');
        }

        // Fetch work hours for employees
        const currentRole = profile?.role || 'empleado';
        if (currentRole === 'empleado' && user.id) {
          const { data: attendance, error: attError } = await supabase
            .from('attendance_logs')
            .select('created_at, state')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (attError) {
            console.error('Attendance fetch error:', JSON.stringify(attError, null, 2));
          } else if (attendance) {
            // Calculate total work hours (simplified)
            const entryLogs = attendance.filter(log => log.state === 'entrada');
            setWorkHours(entryLogs.length * 8); // Estimate 8 hours per entry

            // Latest state for timer
            const latestLog = attendance[0];
            if (latestLog) {
              setLatestState(latestLog.state || 'offline');
              setLatestStateAt(latestLog.created_at);
            }
          }

          // Fetch today's logs for work time calculation
          const today = new Date();
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
          const { data: todayLogs, error: todayLogsError } = await supabase
            .from('attendance_logs')
            .select('created_at, state')
            .eq('user_id', user.id)
            .gte('created_at', todayStart)
            .order('created_at', { ascending: true });

          if (todayLogsError) {
            console.error('Attendance today error:', JSON.stringify(todayLogsError, null, 2));
          } else if (todayLogs && todayLogs.length > 0) {
            let totalMinutes = 0;
            for (let i = 0; i < todayLogs.length; i += 1) {
              const log = todayLogs[i];
              if (log.state === 'entrada') {
                const start = new Date(log.created_at).getTime();
                const next = todayLogs[i + 1] ? new Date(todayLogs[i + 1].created_at).getTime() : Date.now();
                const diffMinutes = Math.max(0, Math.round((next - start) / 60000));
                totalMinutes += diffMinutes;
              }
            }
            setActualWorkMinutes(totalMinutes);
          }

          // Fetch today's schedule - Solo campos necesarios
          const todayDate = new Date().toISOString().split('T')[0];
          const { data: schedule, error: scheduleError } = await supabase
            .from('schedules')
            .select('id, user_id, scheduled_date, start_time, end_time, shift_type, start_at')
            .eq('user_id', user.id)
            .eq('scheduled_date', todayDate)
            .single();

          if (scheduleError) {
            console.error('Schedule fetch error:', JSON.stringify(scheduleError, null, 2));
          } else if (schedule) {
            const startTime = (schedule as { start_time?: string; start_at?: string }).start_time
              ?? (schedule as { start_time?: string; start_at?: string }).start_at
              ?? null;
            const endTime = (schedule as { end_time?: string; end_at?: string }).end_time
              ?? (schedule as { end_time?: string; end_at?: string }).end_at
              ?? null;

            setScheduledStart(startTime);
            setScheduledEnd(endTime);

            if (startTime && endTime) {
              const [sH, sM = '0'] = startTime.split(':');
              const [eH, eM = '0'] = endTime.split(':');
              const startMinutes = Number(sH) * 60 + Number(sM);
              const endMinutes = Number(eH) * 60 + Number(eM);
              setScheduledMinutes(Math.max(0, endMinutes - startMinutes));
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Full Error Details:', JSON.stringify(error, null, 2));
        setUserRole('empleado'); // Fallback to default role
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    if (!latestStateAt) return;

    const updateElapsed = () => {
      const start = new Date(latestStateAt).getTime();
      setElapsedMs(Math.max(0, Date.now() - start));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [latestStateAt]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  // Universal view - all roles see ShiftControl + role-specific widgets
  const stateLabels: Record<string, string> = {
    entrada: t('onShift'),
    descanso: t('onBreak'),
    almuerzo: t('lunch'),
    reunion: t('meeting'),
    offline: t('offShift'),
  };

  const minutes = Math.floor(elapsedMs / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);
  const hours = Math.floor(minutes / 60);
  const displayMinutes = String(minutes % 60).padStart(2, '0');
  const displaySeconds = String(seconds).padStart(2, '0');
  const compliancePercent = scheduledMinutes > 0
    ? Math.min(100, Math.round((actualWorkMinutes / scheduledMinutes) * 100))
    : 0;

  const showCompliance = latestState === 'entrada';

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">¡Hola, {employeeName}!</h1>
              <p className="text-gray-600 mt-2">{currentDate}</p>
            </div>
          </div>
        </header>

        {/* Shift Control (UNIVERSAL - all roles) */}
        {sessionVerified && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-orange-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Control de Asistencia</h2>
            <ShiftControl />
          </div>
        )}

        {/* Role-Specific Content */}
        {userRole === 'supervisor' || userRole === 'gerente' ? (
          /* Manager/Supervisor Dashboard */
          <ManagerDashboard userRole={userRole} />
        ) : (
          /* Employee-Specific Widgets */
          <>
            {/* Work Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Work Hours Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Horas Trabajadas</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">{workHours}h</p>
                    <p className="text-xs text-gray-500 mt-1">Este mes</p>
                  </div>
                  <Clock className="w-16 h-16 text-orange-500 opacity-20" />
                </div>
              </div>

              {/* Today's Schedule Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mi Turno Hoy</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {scheduledStart || '--:--'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Salida: {scheduledEnd || '--:--'}
                    </p>
                  </div>
                  <Calendar className="w-16 h-16 text-blue-500 opacity-20" />
                </div>
              </div>

              {/* Rendimiento de Turnos Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rendimiento de Turnos</p>
                    <p className="text-4xl font-bold text-gray-900 mt-2">
                      {compliancePercent}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cumplimiento diario</p>
                  </div>
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-orange-100" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-[#FF8C00]"
                      style={{
                        clipPath: `inset(${100 - compliancePercent}% 0 0 0)`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#FF8C00]">
                      {compliancePercent}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Temporizador de Estado Actual */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-lg p-6 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-orange-300 font-bold">Temporizador de Estado Actual</p>
                  <h3 className="text-2xl font-bold mt-2">
                    {stateLabels[latestState] || 'Estado desconocido'}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Llevas {hours > 0 ? `${hours}h ` : ''}{displayMinutes}m {displaySeconds}s
                  </p>
                </div>
                <div className="font-mono text-3xl md:text-4xl tracking-widest text-orange-400">
                  {hours > 0 ? String(hours).padStart(2, '0') + ':' : ''}{displayMinutes}:{displaySeconds}
                </div>
              </div>
            </div>

            {/* Estadísticas de Acceso (only if in 'entrada') */}
            {showCompliance && (
              <div className="bg-white rounded-lg shadow-lg p-6 border border-orange-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas de Acceso</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Trabajo Acumulado</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {Math.floor(actualWorkMinutes / 60)}h {String(actualWorkMinutes % 60).padStart(2, '0')}m
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Horario Programado</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {scheduledStart || '--:--'} - {scheduledEnd || '--:--'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Cumplimiento</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="relative w-14 h-14">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="#FFE5CC"
                            strokeWidth="6"
                            fill="transparent"
                          />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            stroke="#FF8C00"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 24}
                            strokeDashoffset={(1 - compliancePercent / 100) * 2 * Math.PI * 24}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#FF8C00]">
                          {compliancePercent}%
                        </span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{compliancePercent}%</p>
                        <p className="text-xs text-gray-500">Cumplimiento</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Estado Actual</h3>
                <p className="text-3xl font-bold">Activo</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Solicitudes</h3>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm opacity-90">Pendientes</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Desempeño</h3>
                <p className="text-3xl font-bold">95%</p>
                <p className="text-sm opacity-90">Puntualidad</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
