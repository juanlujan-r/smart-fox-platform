'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/context/ToastContext';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  differenceInHours,
  differenceInMinutes,
  parseISO,
  addDays,
  isToday,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Clock,
  Calendar,
  ArrowLeftRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  LogIn,
} from 'lucide-react';
import type { ScheduleRow, AttendanceLogRow } from '@/types/database';

const HOURS_MAX_PER_DAY = 10;
const MIN_HOURS_BETWEEN_SHIFTS = 10;

function getLogType(log: AttendanceLogRow): string {
  return (log as { state?: string }).state ?? (log as { type?: string }).type ?? '';
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [h, m, s] = (timeStr || '00:00').split(':').map(Number);
  const d = parseISO(dateStr + 'T00:00:00');
  return setSeconds(setMinutes(setHours(d, h ?? 0), m ?? 0), s ?? 0);
}

function timeStringToMinutes(t: string): number {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

type ScheduleFlexible = ScheduleRow & {
  shift_start?: string | null;
  shift_end?: string | null;
  scheduled_date?: string | null;
};

function getScheduleDate(s: ScheduleFlexible): string | null {
  if (s.scheduled_date) return s.scheduled_date;
  if (s.shift_start) return format(parseISO(s.shift_start), 'yyyy-MM-dd');
  return null;
}

function getScheduleTimes(s: ScheduleFlexible): { date: string | null; start: string | null; end: string | null } {
  if (s.start_time && s.end_time) {
    return { date: getScheduleDate(s), start: s.start_time, end: s.end_time };
  }
  if (s.shift_start && s.shift_end) {
    const startDt = parseISO(s.shift_start);
    const endDt = parseISO(s.shift_end);
    return {
      date: format(startDt, 'yyyy-MM-dd'),
      start: format(startDt, 'HH:mm:ss'),
      end: format(endDt, 'HH:mm:ss'),
    };
  }
  return { date: getScheduleDate(s), start: null, end: null };
}

export default function MisTurnosPage() {
  const { t } = useTranslation();
  const { pushToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'empleado' | 'supervisor' | 'gerente' | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AttendanceLogRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [viewStart, setViewStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeRequest, setExchangeRequest] = useState({
    requested_date: format(new Date(), 'yyyy-MM-dd'),
    requested_start_time: '09:00',
    requested_end_time: '17:00',
    reason: '',
  });
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);

  const canViewSchedule = userRole === 'empleado' || userRole === 'supervisor' || userRole === 'gerente' || !userRole;
  const canRequestExchange = userRole === 'empleado' || !userRole;

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          setLoading(false);
          return;
        }
        
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.warn('Profile not found or error:', profileError);
          setUserRole(null);
        } else {
          setUserRole((profile?.role as 'empleado' | 'supervisor' | 'gerente' | null) ?? null);
        }

        const now = new Date();
        const monthAgo = subMonths(now, 1);
        const from = format(startOfDay(monthAgo), "yyyy-MM-dd'T'00:00:00");
        const to = format(endOfDay(addDays(now, 1)), "yyyy-MM-dd'T'23:59:59");

        const { data: logsData, error: logsError } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', from)
          .lte('created_at', to)
          .order('created_at', { ascending: true });

        if (logsError) {
          console.error('Error loading attendance logs:', logsError);
        } else {
          setLogs((logsData ?? []) as AttendanceLogRow[]);
        }

        const scheduleFrom = format(startOfWeek(viewStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const scheduleTo = format(endOfWeek(viewStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const { data: schedData, error: schedError } = await supabase
          .from('schedules')
          .select('*')
          .eq('user_id', user.id)
          .gte('scheduled_date', scheduleFrom)
          .lte('scheduled_date', scheduleTo)
          .order('scheduled_date');

        if (schedError) {
          console.error('Error loading schedules:', schedError);
        } else {
          setSchedules((schedData ?? []) as ScheduleRow[]);
        }
      } catch (err: unknown) {
        console.error('Error in load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [viewStart]);

  const hoursByDay = useMemo(() => {
    const byDay: Record<string, { start: Date; end: Date }> = {};
    const arr = logs as AttendanceLogRow[];
    for (let i = 0; i < arr.length; i++) {
      const log = arr[i];
      const type = getLogType(log);
      const day = format(parseISO(log.created_at), 'yyyy-MM-dd');
      if (type === 'entrada') {
        if (!byDay[day]) byDay[day] = { start: parseISO(log.created_at), end: parseISO(log.created_at) };
        else byDay[day].start = parseISO(log.created_at);
      } else if (type === 'offline' || type === 'salida') {
        if (byDay[day]) byDay[day].end = parseISO(log.created_at);
      }
    }
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    Object.keys(byDay).forEach((d) => {
      if (d === todayStr && byDay[d].end.getTime() === byDay[d].start.getTime()) {
        byDay[d].end = new Date();
      }
    });
    return byDay;
  }, [logs]);

  const totalHoursForRange = (from: Date, to: Date): number => {
    let total = 0;
    Object.entries(hoursByDay).forEach(([day, { start, end }]) => {
      const d = parseISO(day + 'T12:00:00');
      if (d >= from && d <= to) {
        total += differenceInMinutes(end, start) / 60;
      }
    });
    return Math.round(total * 100) / 100;
  };

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const hoursToday = totalHoursForRange(todayStart, todayEnd);
  const hoursWeek = totalHoursForRange(weekStart, weekEnd);
  const hoursMonth = totalHoursForRange(monthStart, monthEnd);
  const hoursPrevMonth = totalHoursForRange(prevMonthStart, prevMonthEnd);
  const monthDiff = hoursMonth - hoursPrevMonth;
  const monthDiffLabel = monthDiff >= 0 ? `+${monthDiff.toFixed(1)}h vs mes anterior` : `${monthDiff.toFixed(1)}h vs mes anterior`;

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [viewStart]);

  const scheduleByDate = useMemo(() => {
    const map: Record<string, ScheduleRow> = {};
    schedules.forEach((s) => {
      const dateKey = getScheduleDate(s as ScheduleFlexible);
      if (dateKey) map[dateKey] = s;
    });
    return map;
  }, [schedules]);

  const checkInRecords = useMemo(() => {
    const byDay: Record<string, { scheduledStart: Date | null; entradaAt: Date }> = {};
    logs.forEach((log) => {
      const type = getLogType(log);
      if (type !== 'entrada') return;
      const day = format(parseISO(log.created_at), 'yyyy-MM-dd');
      const sched = scheduleByDate[day] as ScheduleFlexible | undefined;
      const schedTimes = sched ? getScheduleTimes(sched) : null;
      const scheduledStart = schedTimes?.start
        ? parseTimeToDate(day, schedTimes.start)
        : null;
      byDay[day] = {
        scheduledStart,
        entradaAt: parseISO(log.created_at),
      };
    });
    return Object.entries(byDay).map(([day, v]) => ({
      day,
      ...v,
      isLate: v.scheduledStart ? v.entradaAt > v.scheduledStart : false,
    })).filter((r) => r.day).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 14);
  }, [logs, scheduleByDate]);

  const handlePrevWeek = () => setViewStart((d) => addDays(d, -7));
  const handleNextWeek = () => setViewStart((d) => addDays(d, 7));

  const validateShiftExchange = (): string | null => {
    const startM = timeStringToMinutes(exchangeRequest.requested_start_time);
    const endM = timeStringToMinutes(exchangeRequest.requested_end_time);
    const durationHours = (endM - startM) / 60;
    if (durationHours > HOURS_MAX_PER_DAY) {
      return `Máximo ${HOURS_MAX_PER_DAY} horas por día. Solicitado: ${durationHours.toFixed(1)}h.`;
    }

    const reqDate = parseISO(exchangeRequest.requested_date + 'T12:00:00');
    const reqStart = parseTimeToDate(exchangeRequest.requested_date, exchangeRequest.requested_start_time);
    void [...schedules];

    const sameDaySched = scheduleByDate[exchangeRequest.requested_date] as ScheduleFlexible | undefined;
    if (sameDaySched) {
      const schedTimes = getScheduleTimes(sameDaySched);
      if (schedTimes.end) {
        const existingEnd = parseTimeToDate(exchangeRequest.requested_date, schedTimes.end);
        const hoursBetween = differenceInHours(reqStart, existingEnd);
        if (hoursBetween < MIN_HOURS_BETWEEN_SHIFTS) {
          return `El nuevo turno debe ser al menos ${MIN_HOURS_BETWEEN_SHIFTS} horas después del anterior.`;
        }
      }
    }

    const prevDay = format(addDays(reqDate, -1), 'yyyy-MM-dd');
    const prevSched = scheduleByDate[prevDay] as ScheduleFlexible | undefined;
    if (prevSched) {
      const schedTimes = getScheduleTimes(prevSched);
      if (schedTimes.end) {
        const prevEnd = parseTimeToDate(prevDay, schedTimes.end);
        const hoursBetween = differenceInHours(reqStart, prevEnd);
        if (hoursBetween < MIN_HOURS_BETWEEN_SHIFTS) {
          return `El nuevo turno debe ser al menos ${MIN_HOURS_BETWEEN_SHIFTS} horas después del turno del día anterior.`;
        }
      }
    }

    return null;
  };

  const submitShiftExchange = async () => {
    const err = validateShiftExchange();
    if (err) {
      pushToast(err, 'error');
      return;
    }
    if (!userId) return;
    setExchangeSubmitting(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const { error } = await supabase.from('shift_exchange_requests').insert([
      {
        user_id: userId,
        original_date: today,
        requested_date: exchangeRequest.requested_date,
        requested_start_time: exchangeRequest.requested_start_time,
        requested_end_time: exchangeRequest.requested_end_time,
        reason: exchangeRequest.reason || null,
        status: 'pendiente',
      },
    ]);
    setExchangeSubmitting(false);
    if (error) {
      pushToast('Error al enviar solicitud: ' + error.message, 'error');
      return;
    }
    pushToast('Solicitud de cambio de turno enviada.', 'success');
    setShowExchangeModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 py-8">
      <header>
        <h1 className="text-4xl font-black text-gray-900">{t('myShifts')}</h1>
        <p className="text-gray-600 mt-2">{t('hoursWorkedDesc')}</p>
      </header>

      {/* Horas Trabajadas Summary */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <Clock className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Horas Trabajadas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hoy</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{hoursToday.toFixed(1)} h</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Esta semana</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{hoursWeek.toFixed(1)} h</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Este mes</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{hoursMonth.toFixed(1)} h</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vs mes anterior</p>
            <p className={`text-xl font-bold mt-1 ${monthDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthDiffLabel}
            </p>
          </div>
        </div>
      </section>

      {/* Manager/Supervisor - No Shifts Assigned Message */}
      {(userRole === 'gerente' || userRole === 'supervisor') && schedules.length === 0 && (
        <section className="fox-card p-6 border border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-amber-900">Turnos no asignados</h3>
              <p className="text-sm text-amber-700 mt-2">
                Como {userRole === 'gerente' ? 'Gerente' : 'Supervisor'}, no tienes turnos asignados actualmente. 
                Contacta al Departamento de Recursos Humanos para solicitar la asignación de tus turnos.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Calendar View + Shift Exchange button */}
      {canViewSchedule ? (
        <section className="fox-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 text-gray-800">
              <Calendar className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Vista Semanal</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
                {format(weekDays[0], 'd MMM', { locale: es })} – {format(weekDays[6], 'd MMM yyyy', { locale: es })}
              </span>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {canRequestExchange && (
              <button
                type="button"
                onClick={() => setShowExchangeModal(true)}
                className="ml-4 flex items-center gap-2 bg-[#FF8C00] text-white px-4 py-2.5 rounded-2xl font-bold shadow-md shadow-[#FF8C00]/25 hover:bg-[#e67d00] transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Solicitar Cambio de Turno
              </button>
              )}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const sched = scheduleByDate[dateStr] as ScheduleFlexible | undefined;
            const isCurrentDay = isToday(day);
            const schedTimes = sched ? getScheduleTimes(sched) : null;
            return (
              <div
                key={dateStr}
                className={`rounded-2xl border-2 p-3 min-h-[100px] ${
                  isCurrentDay
                    ? 'bg-[#FF8C00]/10 border-[#FF8C00] shadow-sm'
                    : 'bg-gray-50/80 border-gray-100'
                }`}
              >
                <p className={`text-xs font-bold uppercase ${isCurrentDay ? 'text-[#FF8C00]' : 'text-gray-500'}`}>
                  {format(day, 'EEE', { locale: es })}
                </p>
                <p className={`text-lg font-black ${isCurrentDay ? 'text-[#FF8C00]' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </p>
                {sched && schedTimes?.start && schedTimes?.end ? (
                  <div className="mt-2 text-xs text-gray-600">
                    <p>{schedTimes.start.slice(0, 5)} – {schedTimes.end.slice(0, 5)}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">Sin turno</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    ) : null}

      {/* Check-in vs Schedule (late highlight) */}
      {canViewSchedule ? (
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <LogIn className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Entradas vs Horario</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Comparación de tu hora de entrada registrada con el turno programado. Entradas tardías en rojo.
        </p>
        <div className="space-y-2">
          {checkInRecords.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay registros de entrada recientes.</p>
          ) : (
            checkInRecords.map((r) => (
              <div
                key={r.day}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                  r.isLate ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-800">{format(parseISO(r.day + 'T12:00:00'), 'EEE d MMM yyyy', { locale: es })}</span>
                  <span className="text-sm text-gray-600">
                    Entrada: {format(r.entradaAt, 'HH:mm')}
                    {r.scheduledStart && (
                      <span className="text-gray-500"> · Programado: {format(r.scheduledStart, 'HH:mm')}</span>
                    )}
                  </span>
                </div>
                {r.isLate && (
                  <span className="flex items-center gap-1.5 text-red-600 font-semibold text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Tardanza
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </section>
      ) : null}

      {/* Shift Exchange Modal */}
      {canRequestExchange && showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="fox-card max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">{t('shiftChangeRequest')}</h3>
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              {t('maxTenHoursDay')}
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-600">{t('desiredDate')}</span>
                <input
                  type="date"
                  value={exchangeRequest.requested_date}
                  onChange={(e) => setExchangeRequest((r) => ({ ...r, requested_date: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">Hora inicio</span>
                  <input
                    type="time"
                    value={exchangeRequest.requested_start_time}
                    onChange={(e) => setExchangeRequest((r) => ({ ...r, requested_start_time: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-600">Hora fin</span>
                  <input
                    type="time"
                    value={exchangeRequest.requested_end_time}
                    onChange={(e) => setExchangeRequest((r) => ({ ...r, requested_end_time: e.target.value }))}
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Motivo (opcional)</span>
                <textarea
                  value={exchangeRequest.reason}
                  onChange={(e) => setExchangeRequest((r) => ({ ...r, reason: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none resize-none"
                  placeholder="Ej. Cita médica"
                />
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowExchangeModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitShiftExchange}
                disabled={exchangeSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF8C00] text-white font-bold hover:bg-[#e67d00] disabled:opacity-70"
              >
                {exchangeSubmitting ? 'Enviando…' : 'Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
