"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Coffee, Utensils, Users, Power, AlertCircle } from 'lucide-react';

const SHIFT_STATES = [
  { id: 'entrada', label: 'En Turno', icon: Clock, color: 'bg-green-500', hover: 'hover:bg-green-600' },
  { id: 'descanso', label: 'Descanso', icon: Coffee, color: 'bg-yellow-500', hover: 'hover:bg-yellow-600' },
  { id: 'almuerzo', label: 'Almuerzo', icon: Utensils, color: 'bg-blue-500', hover: 'hover:bg-blue-600' },
  { id: 'reunion', label: 'Reunión', icon: Users, color: 'bg-purple-500', hover: 'hover:bg-purple-600' },
  { id: 'offline', label: 'Finalizar', icon: Power, color: 'bg-red-500', hover: 'hover:bg-red-600' },
];

export default function ShiftControl() {
  const [currentState, setCurrentState] = useState('offline');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [loading, setLoading] = useState(true);

  // 1. Cargar estado inicial al abrir la app
  useEffect(() => {
    fetchCurrentState();
  }, []);

  // 2. Cronómetro que se actualiza cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && currentState !== 'offline') {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setElapsedTime(`${hours}:${minutes}:${seconds}`);
      }, 1000);
    } else {
      setElapsedTime('00:00:00');
    }
    return () => clearInterval(interval);
  }, [startTime, currentState]);

  const fetchCurrentState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Buscar el último log del usuario
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCurrentState(data.state);
        // Si el estado no es offline, guardamos la hora de inicio para el cronómetro
        if (data.state !== 'offline') {
          setStartTime(new Date(data.created_at));
        }
      }
    }
    setLoading(false);
  };

  const handleStateChange = async (newState: string) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const now = new Date();
      const { error } = await supabase.from('attendance_logs').insert([
        { user_id: user.id, state: newState, created_at: now.toISOString() }
      ]);

      if (!error) {
        setCurrentState(newState);
        setStartTime(newState === 'offline' ? null : now);
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tighter">
          Gestión de Mi Turno
        </h3>
        {/* CRONÓMETRO VISUAL */}
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-900 px-4 py-2 rounded-lg">
          <div className={`w-3 h-3 rounded-full animate-pulse ${currentState !== 'offline' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-500 uppercase">{currentState}</span>
            <span className="text-xl font-mono font-bold text-gray-800 dark:text-white leading-none">
              {elapsedTime}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SHIFT_STATES.map((state) => (
          <button
            key={state.id}
            disabled={loading || currentState === state.id}
            onClick={() => handleStateChange(state.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border-b-4 active:translate-y-1 ${
              currentState === state.id 
                ? `${state.color} text-white border-black/20 shadow-inner scale-95` 
                : `bg-gray-50 dark:bg-gray-700 text-gray-400 border-transparent ${state.hover} hover:text-white`
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <state.icon className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">{state.label}</span>
          </button>
        ))}
      </div>

      {currentState !== 'offline' && (
        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center gap-3 border border-orange-100 dark:border-orange-800 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="text-[#FF8C00] w-5 h-5 flex-shrink-0" />
          <p className="text-xs text-orange-800 dark:text-orange-200 font-medium">
            Turno activo desde: {startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. 
            Recuerda finalizar al terminar tu jornada.
          </p>
        </div>
      )}
    </div>
  );
}