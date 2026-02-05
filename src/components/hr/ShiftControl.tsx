"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Coffee, Utensils, Users, LogOut, AlertTriangle } from 'lucide-react';

const STATES = [
  { id: 'entrada', label: 'Entrada', icon: Clock, color: 'bg-green-500' },
  { id: 'descanso', label: 'Descanso', icon: Coffee, color: 'bg-yellow-500' },
  { id: 'almuerzo', label: 'Almuerzo', icon: Utensils, color: 'bg-blue-500' },
  { id: 'reunion', label: 'Reunión', icon: Users, color: 'bg-purple-500' },
  { id: 'offline', label: 'Offline', icon: LogOut, color: 'bg-gray-500' },
];

export default function ShiftControl() {
  const [currentState, setCurrentState] = useState('offline');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [overtimeAlert, setOvertimeAlert] = useState(false);

  useEffect(() => {
    // Alerta de 8 horas (28800000 ms)
    const interval = setInterval(() => {
      if (currentState === 'entrada' && startTime) {
        const elapsed = Date.now() - startTime;
        if (elapsed > 28800000) setOvertimeAlert(true);
      }
    }, 60000); // Revisar cada minuto
    return () => clearInterval(interval);
  }, [currentState, startTime]);

  const handleStateChange = async (newState: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('attendance_logs').insert([
      { user_id: user.id, state: newState }
    ]);

    if (!error) {
      setCurrentState(newState);
      if (newState === 'entrada') {
        setStartTime(Date.now());
        setOvertimeAlert(false);
      } else if (newState === 'offline') {
        setStartTime(null);
      }
    }
  };

  return (
    <div className="fox-card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-black text-gray-800 uppercase tracking-tighter">Control de Estado</h3>
        {overtimeAlert && (
          <div className="flex items-center gap-2 text-red-500 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase">Alerta: +8h Activo</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATES.map((s) => (
          <button
            key={s.id}
            onClick={() => handleStateChange(s.id)}
            className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 ${
              currentState === s.id ? `${s.color} text-white shadow-lg` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            <s.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}