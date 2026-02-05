"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Coffee, Utensils, Users, Power } from 'lucide-react';

const STATES = [
  { id: 'entrada', label: 'In Shift', icon: Clock, color: 'bg-green-500' },
  { id: 'descanso', label: 'Break', icon: Coffee, color: 'bg-yellow-500' },
  { id: 'almuerzo', label: 'Lunch', icon: Utensils, color: 'bg-yellow-500' },
  { id: 'reunion', label: 'Meeting', icon: Users, color: 'bg-purple-500' },
  { id: 'offline', label: 'Shift Ended', icon: Power, color: 'bg-gray-500' },
];

export default function ShiftControl() {
  const [currentState, setCurrentState] = useState('offline');
  const [loading, setLoading] = useState(false);

  const handleStateChange = async (newState: string) => {
    if (loading || newState === currentState) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('attendance_logs').insert([
        { user_id: user.id, state: newState }
      ]);

      if (!error) {
        setCurrentState(newState);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStateConfig = STATES.find((state) => state.id === currentState);
  const statusColor = currentState === 'entrada'
    ? 'bg-green-500'
    : currentState === 'descanso' || currentState === 'almuerzo'
      ? 'bg-yellow-500'
      : currentState === 'reunion'
        ? 'bg-purple-500'
        : 'bg-gray-500';

  return (
    <div className="fox-card p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h3 className="font-black text-gray-800 uppercase tracking-tighter">Control de Estado</h3>
        <div className="flex items-center gap-3 bg-white/70 rounded-full px-4 py-2 border border-orange-200 shadow-sm">
          <span className={`h-3 w-3 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Current Status</span>
          <span className="text-xs font-semibold text-gray-900">
            {currentStateConfig?.label || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATES.map((s) => (
          <button
            key={s.id}
            onClick={() => handleStateChange(s.id)}
            disabled={loading || currentState === s.id}
            className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-95 border ${
              currentState === s.id
                ? `${s.color} text-white shadow-lg border-transparent`
                : 'bg-gray-50 text-gray-500 hover:bg-orange-50 hover:text-[#FF8C00] border-orange-100'
            } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <s.icon className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}