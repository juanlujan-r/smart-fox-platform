"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Coffee, Utensils, Users, Power, Timer, History, Loader2 } from 'lucide-react';

const SHIFT_STATES = [
  { id: 'entrada', label: 'En Turno', icon: Clock, color: 'bg-green-600', activeColor: 'ring-green-500' },
  { id: 'descanso', label: 'Descanso', icon: Coffee, color: 'bg-yellow-500', activeColor: 'ring-yellow-500' },
  { id: 'almuerzo', label: 'Almuerzo', icon: Utensils, color: 'bg-blue-500', activeColor: 'ring-blue-500' },
  { id: 'reunion', label: 'Reunión', icon: Users, color: 'bg-purple-500', activeColor: 'ring-purple-500' },
  { id: 'offline', label: 'Salida', icon: Power, color: 'bg-red-500', activeColor: 'ring-red-500' },
];

export default function ShiftControl() {
  const [currentState, setCurrentState] = useState('offline');
  const [logs, setLogs] = useState<any[]>([]);
  const [totalWorked, setTotalWorked] = useState('00h 00m');
  const [loading, setLoading] = useState(true);

  // Carga de datos estable
  const fetchDailyLogs = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error de autenticación:', authError);
        return;
      }
      
      if (!user) {
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error al cargar registros:', error);
        return;
      }

      if (data) {
        const lastLog = data[data.length - 1];
        if (lastLog) setCurrentState(lastLog.state);
        else setCurrentState('offline');

        // Calcular tiempo trabajado
        let workSeconds = 0;
        const processedLogs = data.map((log, index) => {
          const start = new Date(log.created_at);
          const nextLog = data[index + 1];
          // Si no hay siguiente log, usamos la hora actual SOLO si no es "offline"
          const end = nextLog ? new Date(nextLog.created_at) : (log.state !== 'offline' ? new Date() : start);
          
          const durationMs = end.getTime() - start.getTime();
          
          if (['entrada', 'reunion'].includes(log.state) && log.state !== 'offline') {
            workSeconds += durationMs / 1000;
          }

          return {
            ...log,
            formattedTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: formatDuration(durationMs)
          };
        });

        setLogs(processedLogs.reverse());
        setTotalWorked(formatDuration(workSeconds * 1000));
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyLogs();
    const interval = setInterval(fetchDailyLogs, 60000); // Actualiza cada minuto
    return () => clearInterval(interval);
  }, [fetchDailyLogs]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours}h ${minutes}m`;
  };

  const handleStateChange = async (newState: string) => {
    setLoading(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error de autenticación:', authError);
        alert('Error de autenticación. Por favor, vuelve a iniciar sesión.');
        return;
      }
      
      if (!user) {
        alert("Error: No se encontró usuario autenticado.");
        return;
      }

      const { error: insertError } = await supabase.from('attendance_logs').insert([
        { user_id: user.id, state: newState }
      ]);

      if (insertError) {
        console.error('Error al insertar log:', insertError);
        alert(`Error al guardar: ${insertError.message || 'Intente de nuevo'}`);
        return;
      }

      await fetchDailyLogs(); // Recarga inmediata tras éxito
    } catch (error: any) {
      console.error("Error al marcar turno:", error);
      alert(`Error al guardar: ${error.message || error.details || 'Intente de nuevo'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) return <div className="p-6 text-center"><Loader2 className="animate-spin mx-auto text-orange-500" /></div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tiempo Trabajado</h2>
          <div className="flex items-center gap-2 mt-1">
            <Timer className="w-5 h-5 text-[#FF8C00]" />
            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">{totalWorked}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
            currentState !== 'offline' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${currentState !== 'offline' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {currentState}
          </span>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SHIFT_STATES.map((state) => (
          <button
            key={state.id}
            onClick={() => handleStateChange(state.id)}
            disabled={loading || currentState === state.id}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border-2 ${
              currentState === state.id 
                ? `border-${state.color.replace('bg-', '')} bg-gray-50 dark:bg-gray-700 ring-2 ${state.activeColor} ring-offset-2` 
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400'
            } disabled:opacity-50`}
          >
            <div className={`p-2 rounded-lg ${currentState === state.id ? state.color + ' text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
              <state.icon className="w-5 h-5" />
            </div>
            <span className="mt-2 text-[10px] font-bold uppercase">{state.label}</span>
          </button>
        ))}
      </div>

      <div className="px-6 pb-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
          <History className="w-3 h-3" /> Historial
        </h3>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-800">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-2 font-mono text-gray-600 dark:text-gray-400 text-xs">{log.formattedTime}</td>
                  <td className="px-4 py-2 capitalize font-medium text-gray-800 dark:text-gray-200 text-xs">{log.state}</td>
                  <td className="px-4 py-2 text-right text-gray-500 text-xs">{log.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}