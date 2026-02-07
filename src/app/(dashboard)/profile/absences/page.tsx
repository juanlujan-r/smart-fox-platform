"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Calendar, Clock, User as UserIcon } from 'lucide-react';

interface Absence {
  id: string;
  date: string;
  time: string;
  marked_by: string;
  marked_by_name: string;
  reason: string;
  details: string;
  type: string;
}

export default function AbsencesPage() {
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<Absence[]>([]);

  useEffect(() => {
    loadAbsences();
  }, []);

  const loadAbsences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get attendance logs marked as 'offline' or absences from HR requests
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('id, created_at, state, notes')
        .eq('user_id', user.id)
        .eq('state', 'offline')
        .order('created_at', { ascending: false });

      const { data: requests } = await supabase
        .from('hr_requests')
        .select('id, created_at, request_type, description, status, reviewed_by')
        .eq('user_id', user.id)
        .in('request_type', ['ausencia', 'permiso', 'falta'])
        .order('created_at', { ascending: false });

      const formattedAbsences: Absence[] = [];

      // Add logs
      if (logs) {
        for (const log of logs) {
          formattedAbsences.push({
            id: log.id.toString(),
            date: new Date(log.created_at).toLocaleDateString('es-CO'),
            time: new Date(log.created_at).toLocaleTimeString('es-CO'),
            marked_by: 'Sistema',
            marked_by_name: 'Registro Automático',
            reason: 'Ausencia registrada',
            details: log.notes || 'Sin detalles',
            type: 'log',
          });
        }
      }

      // Add requests
      if (requests) {
        for (const req of requests) {
          let reviewerName = 'Pendiente';
          if (req.reviewed_by) {
            const { data: reviewer } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', req.reviewed_by)
              .single();
            if (reviewer) reviewerName = reviewer.full_name;
          }

          formattedAbsences.push({
            id: req.id,
            date: new Date(req.created_at).toLocaleDateString('es-CO'),
            time: new Date(req.created_at).toLocaleTimeString('es-CO'),
            marked_by: req.reviewed_by || '',
            marked_by_name: reviewerName,
            reason: req.request_type || 'Solicitud',
            details: req.description || 'Sin descripción',
            type: 'request',
          });
        }
      }

      // Sort by date
      formattedAbsences.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB.getTime() - dateA.getTime();
      });

      setAbsences(formattedAbsences);
    } catch (err) {
      console.error('Error loading absences:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <AlertCircle className="w-8 h-8 text-red-600" />
        Mis Faltas
      </h1>

      {absences.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-800 font-semibold">¡Excelente! No tienes faltas registradas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {absences.map((absence) => (
            <div
              key={absence.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize">{absence.reason}</h3>
                    <p className="text-sm text-gray-500">{absence.type === 'log' ? 'Registro del sistema' : 'Solicitud de ausencia'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  absence.type === 'log' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {absence.type === 'log' ? 'Automático' : 'Manual'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{absence.date}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{absence.time}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>{absence.marked_by_name}</span>
                </div>
              </div>

              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{absence.details}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
