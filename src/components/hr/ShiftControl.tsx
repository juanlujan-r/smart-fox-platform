"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Coffee, Utensils, Users, Power, Timer, History, AlertCircle } from 'lucide-react';

const SHIFT_STATES = [
  { id: 'entrada', label: 'En Turno', icon: Clock, bgColor: 'bg-green-600', borderColor: 'border-green-600', ringColor: 'ring-green-500', textColor: 'text-green-700' },
  { id: 'descanso', label: 'Descanso', icon: Coffee, bgColor: 'bg-yellow-500', borderColor: 'border-yellow-500', ringColor: 'ring-yellow-500', textColor: 'text-yellow-700' },
  { id: 'almuerzo', label: 'Almuerzo', icon: Utensils, bgColor: 'bg-blue-500', borderColor: 'border-blue-500', ringColor: 'ring-blue-500', textColor: 'text-blue-700' },
  { id: 'reunion', label: 'Reunión', icon: Users, bgColor: 'bg-purple-500', borderColor: 'border-purple-500', ringColor: 'ring-purple-500', textColor: 'text-purple-700' },
  { id: 'offline', label: 'Salida', icon: Power, bgColor: 'bg-red-500', borderColor: 'border-red-500', ringColor: 'ring-red-500', textColor: 'text-red-700' },
];

export default function ShiftControl() {
  const [currentState, setCurrentState] = useState('offline');
  const [logs, setLogs] = useState<any[]>([]);
  const [totalWorked, setTotalWorked] = useState('00h 00m');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper para formato de duración
  const formatDuration = (ms: number) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  };

  // Función estable para cargar logs
  const fetchDailyLogs = useCallback(async () => {
    try {
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error('Error de autenticación');
      }
      
      if (!user) {
        setError('Usuario no encontrado');
        setLoading(false);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error: fetchError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        // 1. Estado Actual
        const lastLog = data[data.length - 1];
        setCurrentState(lastLog?.state || 'offline');

        // 2. Procesar Historial y Tiempo Total
        let workSeconds = 0;
        const processedLogs = data.map((log, index) => {
          const start = new Date(log.created_at);
          const nextLog = data[index + 1];
          const end = nextLog ? new Date(nextLog.created_at) : new Date();
          
          const durationMs = Math.max(0, end.getTime() - start.getTime());
          
          // Sumar tiempo productivo (entrada y reunión)
          if (['entrada', 'reunion'].includes(log.state)) {
            workSeconds += durationMs / 1000;
          }

          return {
            ...log,
            formattedTime: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }),
            duration: formatDuration(durationMs),
            durationMs
          };
        });

        setLogs(processedLogs.reverse());
        setTotalWorked(formatDuration(workSeconds * 1000));
      } else {
        setLogs([]);
        setTotalWorked('00h 00m');
        setCurrentState('offline');
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto: Cargar logs al inicio y actualizar cronómetro cada minuto
  useEffect(() => {
    fetchDailyLogs();
    const interval = setInterval(fetchDailyLogs, 60000); // Actualiza cada minuto
    return () => clearInterval(interval);
  }, [fetchDailyLogs]);

  const handleStateChange = async (newState: string) => {
    if (currentState === newState) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuario no autenticado');
      }
      
      const { error: insertError } = await supabase
        .from('attendance_logs')
        .insert([{ user_id: user.id, state: newState }]);
      
      if (insertError) throw insertError;
      
      // Actualización optimista
      setCurrentState(newState);
      
      // Recarga completa para actualizar historial
      await fetchDailyLogs();
    } catch (err: any) {
      console.error('Error changing state:', err);
      setError(err.message || 'Error al cambiar el estado');
    } finally {
      setLoading(false);
    }
  };

  const getStateDisplay = () => {
    const state = SHIFT_STATES.find(s => s.id === currentState);
    return state?.label || currentState;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* HEADER */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Tiempo Trabajado Hoy
            </h2>
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-[#FF8C00]" />
              <span className="text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                {totalWorked}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado Actual</p>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase shadow-sm ${
              currentState !== 'offline' 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                currentState !== 'offline' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              {getStateDisplay()}
            </span>
          </div>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONTROLES */}
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {SHIFT_STATES.map((state) => {
            const isActive = currentState === state.id;
            return (
              <button
                key={state.id}
                onClick={() => handleStateChange(state.id)}
                disabled={loading || isActive}
                className={`group flex flex-col items-center justify-center p-4 rounded-xl transition-all border-2 ${
                  isActive
                    ? `${state.borderColor} bg-gray-50 dark:bg-gray-700/50 ring-2 ${state.ringColor} ring-offset-2`
                    : 'border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                } disabled:opacity-60 disabled:cursor-not-allowed active:scale-95`}
              >
                <div className={`p-3 rounded-xl transition-all ${
                  isActive 
                    ? `${state.bgColor} text-white shadow-md` 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                }`}>
                  <state.icon className="w-6 h-6" />
                </div>
                <span className={`mt-3 text-[10px] font-bold uppercase tracking-wider ${
                  isActive ? state.textColor : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {state.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
            <History className="w-4 h-4" /> 
            Historial del Día
          </h3>
          {logs.length > 0 && (
            <span className="text-xs text-gray-400">
              {logs.length} registro{logs.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  Duración
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-400 text-sm">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Sin actividad registrada hoy
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => {
                  const stateConfig = SHIFT_STATES.find(s => s.id === log.state);
                  return (
                    <tr 
                      key={`${log.id}-${i}`} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300 text-sm font-semibold">
                        {log.formattedTime}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stateConfig?.bgColor || 'bg-gray-400'}`} />
                          <span className="font-medium text-gray-800 dark:text-gray-200 text-sm capitalize">
                            {log.state.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 text-sm font-mono">
                        {log.duration}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}