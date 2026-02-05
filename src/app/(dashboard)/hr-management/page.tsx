'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { format, parseISO, isBefore, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Users,
  Clock,
  Coffee,
  Utensils,
  Power,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { AttendanceLogRow, HrRequestRow, ScheduleRow } from '@/types/database';
import type { PersonalData } from '@/types/database';
import ScheduleManager from '../hr/ScheduleManager';
import SalaryManager from '@/components/hr/SalaryManager';
import PayrollGenerator from '@/components/hr/PayrollGenerator';

const BUCKET = 'hr-attachments';

type ProfileWithRole = { id: string; role?: string; personal_data?: PersonalData | null };

const STATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  entrada: { label: 'Entrada', color: 'text-green-700', bg: 'bg-green-500' },
  descanso: { label: 'Descanso', color: 'text-amber-700', bg: 'bg-amber-500' },
  almuerzo: { label: 'Almuerzo', color: 'text-blue-700', bg: 'bg-blue-500' },
  reunion: { label: 'Reunión', color: 'text-purple-700', bg: 'bg-purple-500' },
  offline: { label: 'Offline', color: 'text-gray-600', bg: 'bg-gray-500' },
  salida: { label: 'Salida', color: 'text-gray-600', bg: 'bg-gray-500' },
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  permiso: 'Permiso',
  licencia: 'Licencia',
  novedad: 'Novedad',
  vacaciones: 'Vacaciones',
  incapacidad: 'Incapacidad',
};

function getLogState(log: AttendanceLogRow): string {
  return (log as { state?: string }).state ?? (log as { type?: string }).type ?? 'offline';
}

function getDisplayName(profile: ProfileWithRole): string {
  const pd = profile.personal_data;
  if (pd && typeof pd === 'object' && (pd as PersonalData).fullName) {
    return (pd as PersonalData).fullName!.trim() || 'Sin nombre';
  }
  return 'Sin nombre';
}

function formatTimeSince(dateStr: string): string {
  const d = parseISO(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} d`;
}

function getStateIcon(state: string) {
  if (state === 'entrada') return Clock;
  if (state === 'descanso') return Coffee;
  if (state === 'almuerzo') return Utensils;
  if (state === 'reunion') return Users;
  return Power;
}

export default function GestionEquipoPage() {
  const { pushToast } = useToast();
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [logs, setLogs] = useState<AttendanceLogRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<HrRequestRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [entradaLogsToday, setEntradaLogsToday] = useState<{ user_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'equipo' | 'horarios'>('equipo');
  const [userRole, setUserRole] = useState<string>('');

  const loadAttendance = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStart = `${today}T00:00:00`;
    const todayEnd = `${today}T23:59:59`;

    const [logsRes, logsTodayRes] = await Promise.all([
      supabase.from('attendance_logs').select('*').order('created_at', { ascending: false }),
      supabase
        .from('attendance_logs')
        .select('user_id, created_at, state, type')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd),
    ]);

    if (logsRes.data) setLogs(logsRes.data as AttendanceLogRow[]);

    const todayLogs = (logsTodayRes.data ?? []) as AttendanceLogRow[];
    const todayEntradaUserIds = new Set<string>();
    todayLogs.forEach((l) => {
      const state = (l as { state?: string }).state ?? (l as { type?: string }).type;
      if (state === 'entrada') todayEntradaUserIds.add(l.user_id);
    });
    setEntradaLogsToday(Array.from(todayEntradaUserIds).map((user_id) => ({ user_id })));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const today = format(new Date(), 'yyyy-MM-dd');

        // Fetch current user's role
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Auth error:', authError);
        }
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profileError) {
            console.error('Profile error:', profileError);
          }
          if (profile) setUserRole(profile.role || '');
        }

        const [profilesRes, logsRes, requestsRes, schedulesRes, logsTodayRes] = await Promise.all([
          supabase.from('profiles').select('id, role, personal_data').order('id'),
          supabase
            .from('attendance_logs')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('hr_requests')
            .select('*')
            .eq('status', 'pendiente')
            .order('created_at', { ascending: false }),
          supabase
            .from('schedules')
            .select('*')
            .eq('scheduled_date', today),
          supabase
            .from('attendance_logs')
            .select('user_id, created_at, state, type')
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`),
        ]);

        if (profilesRes.error) {
          console.error('Profiles error:', profilesRes.error);
        } else if (profilesRes.data) {
          setProfiles(profilesRes.data as ProfileWithRole[]);
        }

        if (logsRes.error) {
          console.error('Logs error:', logsRes.error);
        } else if (logsRes.data) {
          setLogs(logsRes.data as AttendanceLogRow[]);
        }

        if (requestsRes.error) {
          console.error('Requests error:', requestsRes.error);
        } else if (requestsRes.data) {
          setPendingRequests(requestsRes.data as HrRequestRow[]);
        }

        if (schedulesRes.error) {
          console.error('Schedules error:', schedulesRes.error);
        } else if (schedulesRes.data) {
          setSchedules(schedulesRes.data as ScheduleRow[]);
        }

        if (logsTodayRes.error) {
          console.error('Today logs error:', logsTodayRes.error);
        } else {
          const todayLogs = (logsTodayRes.data ?? []) as AttendanceLogRow[];
          const todayEntradaUserIds = new Set<string>();
          todayLogs.forEach((l) => {
            const state = (l as { state?: string }).state ?? (l as { type?: string }).type;
            if (state === 'entrada') todayEntradaUserIds.add(l.user_id);
          });
          setEntradaLogsToday(Array.from(todayEntradaUserIds).map((user_id) => ({ user_id })));
        }
      } catch (err: any) {
        console.error('Error in load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('attendance-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance_logs' },
        () => {
          loadAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const latestByUser = useMemo(() => {
    const map = new Map<string, AttendanceLogRow>();
    for (const log of logs) {
      if (!log.user_id) continue;
      if (!map.has(log.user_id)) map.set(log.user_id, log);
    }
    return map;
  }, [logs]);

  const profileById = useMemo(() => {
    const map = new Map<string, ProfileWithRole>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  const liveCards = useMemo(() => {
    return profiles.map((profile) => {
      const lastLog = latestByUser.get(profile.id);
      const state = lastLog ? getLogState(lastLog) : 'offline';
      const config = STATE_CONFIG[state] ?? { label: state, color: 'text-gray-600', bg: 'bg-gray-500' };
      return {
        profile,
        lastLog,
        state,
        config,
        name: getDisplayName(profile),
      };
    });
  }, [profiles, latestByUser]);

  const teamSummary = useMemo(() => {
    let enTurno = 0;
    let enDescanso = 0;
    let ausentes = 0;
    liveCards.forEach(({ state }) => {
      if (state === 'entrada') enTurno += 1;
      else if (state === 'descanso' || state === 'almuerzo') enDescanso += 1;
      else if (state === 'offline' || state === 'salida') ausentes += 1;
    });
    return { enTurno, enDescanso, ausentes };
  }, [liveCards]);

  const getElapsedMs = (dateStr?: string) => {
    if (!dateStr) return 0;
    const start = parseISO(dateStr).getTime();
    return Math.max(0, nowTs - start);
  };

  const absenceAlertList = useMemo(() => {
    const now = new Date();
    const cutoff = addMinutes(now, -15);
    const todayStr = format(now, 'yyyy-MM-dd');
    const enteredUserIds = new Set(entradaLogsToday.map((e) => e.user_id));

    return schedules
      .filter((s) => {
        const [h, m] = (s.start_time || '00:00').split(':').map(Number);
        const scheduledStart = new Date(parseISO(todayStr));
        scheduledStart.setHours(h ?? 0, m ?? 0, 0, 0);
        return isBefore(scheduledStart, cutoff) && !enteredUserIds.has(s.user_id);
      })
      .map((s) => ({
        schedule: s,
        name: getDisplayName(profileById.get(s.user_id) ?? { id: s.user_id }),
        user_id: s.user_id,
      }));
  }, [schedules, entradaLogsToday, profileById]);

  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('hr_requests')
      .update({ status: 'aprobado', updated_at: new Date().toISOString() })
      .eq('id', id);
    setUpdatingId(null);
    if (error) {
      pushToast('Error al aprobar: ' + error.message, 'error');
      return;
    }
    pushToast('Solicitud aprobada', 'success');
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleReject = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('hr_requests')
      .update({ status: 'rechazado', updated_at: new Date().toISOString() })
      .eq('id', id);
    setUpdatingId(null);
    if (error) {
      pushToast('Error al rechazar: ' + error.message, 'error');
      return;
    }
    pushToast('Solicitud rechazada', 'success');
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) {
      pushToast('No se pudo abrir el adjunto: ' + error.message, 'error');
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#FF8C00]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Equipo</h1>
        <p className="text-gray-500 mt-1">Estado en vivo, solicitudes pendientes y alertas de ausencia</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('equipo')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
            activeTab === 'equipo'
              ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF8C00]/50'
          }`}
        >
          Gestión de Equipo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('horarios')}
          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
            activeTab === 'horarios'
              ? 'bg-[#FF8C00] text-white border-[#FF8C00]'
              : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF8C00]/50'
          }`}
        >
          Gestión de Horarios
        </button>
      </div>

      {activeTab === 'horarios' && (
        <ScheduleManager />
      )}

      {activeTab === 'equipo' && (
      <>

      {/* Live Status Board */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <Users className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Estado en vivo</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-green-50 border border-green-100 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-green-700">En Turno</p>
            <p className="text-2xl font-black text-green-800 mt-1">{teamSummary.enTurno}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">En Descanso</p>
            <p className="text-2xl font-black text-amber-800 mt-1">{teamSummary.enDescanso}</p>
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Ausentes</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{teamSummary.ausentes}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {liveCards.map(({ profile, lastLog, state, config, name }) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 flex items-center gap-4 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${config.bg}`} title={config.label}>
                {(() => {
                  const Icon = getStateIcon(state);
                  return <Icon className="w-5 h-5 text-white" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">{name}</p>
                <p className={`text-xs font-medium uppercase tracking-wide ${config.color}`}>
                  {config.label}
                </p>
                {lastLog && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeSince(lastLog.created_at)}
                    </p>
                    {(state === 'descanso' || state === 'almuerzo') && (
                      (() => {
                        const elapsedMs = getElapsedMs(lastLog.created_at);
                        const elapsedMin = Math.floor(elapsedMs / 60000);
                        const elapsedSec = Math.floor((elapsedMs % 60000) / 1000);
                        const isOverLimit = elapsedMin >= 20;
                        return (
                          <div
                            className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-widest ${
                              isOverLimit
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            <span>⏱</span>
                            {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {liveCards.length === 0 && (
          <p className="text-gray-500 py-6 text-center">No hay perfiles para mostrar.</p>
        )}
      </section>

      {/* Request Manager */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <FileText className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Solicitudes pendientes</h2>
        </div>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="space-y-3">
            {pendingRequests.map((req) => {
              const requesterName = getDisplayName(profileById.get(req.user_id) ?? { id: req.user_id });
              const typeLabel = REQUEST_TYPE_LABELS[req.type] ?? req.type;
              return (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">{requesterName}</p>
                    <p className="text-sm text-[#FF8C00] font-medium">{typeLabel}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(parseISO(req.start_date), 'd MMM', { locale: es })} –{' '}
                      {format(parseISO(req.end_date), 'd MMM yyyy', { locale: es })}
                    </p>
                    {req.details && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.details}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {req.attachment_url && (
                      <button
                        type="button"
                        onClick={() => openAttachment(req.attachment_url!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-[#FF8C00]/50 hover:bg-[#FF8C00]/5 text-gray-600 text-sm font-medium transition-colors"
                        title="Ver adjunto (Incapacidades/Permisos)"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver adjunto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApprove(req.id)}
                      disabled={updatingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 font-medium text-sm disabled:opacity-70"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(req.id)}
                      disabled={updatingId === req.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 font-medium text-sm disabled:opacity-70"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Absence Alert */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Lista de Alerta / Ausentes</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Empleados con turno programado que debía iniciar hace más de 15 minutos y no tienen registro de entrada.
        </p>
        {absenceAlertList.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">Ninguna alerta de ausencia.</p>
        ) : (
          <ul className="space-y-2">
            {absenceAlertList.map(({ schedule, name, user_id }) => (
              <li
                key={`${user_id}-${schedule.scheduled_date}-${schedule.start_time}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800"
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{name}</span>
                <span className="text-sm opacity-90">
                  Turno {schedule.start_time?.slice(0, 5)} – Sin entrada
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      </>
      )}

      {/* Financial Management Section - Gerentes Only */}
      {activeTab === 'equipo' && userRole === 'gerente' && (
        <>
          <hr className="my-8 border-gray-200" />
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-[#FF8C00]">💰</span> Nómina y Salarios
            </h2>
            <p className="text-sm text-gray-600 mt-1">Gestión financiera del equipo</p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <SalaryManager />
            <PayrollGenerator />
          </div>
        </>
      )}
    </div>
  );
}
