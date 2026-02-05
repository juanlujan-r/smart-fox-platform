'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, parseISO, isBefore, isAfter } from 'date-fns';
import { Calendar, Clock, Edit3, Save, X } from 'lucide-react';
import type { ScheduleRow } from '@/types/database';
import type { PersonalData } from '@/types/database';

type ProfileWithRole = { id: string; role?: string; personal_data?: PersonalData | null };

type EditableSchedule = {
	id?: string;
	user_id: string;
	scheduled_date: string;
	start_time: string;
	end_time: string;
	break_start?: string | null;
	break_end?: string | null;
};

const SHIFT_MAX_HOURS = 10;
const REST_MIN_HOURS = 10;

function getDisplayName(profile: ProfileWithRole): string {
	const pd = profile.personal_data;
	if (pd && typeof pd === 'object' && (pd as PersonalData).fullName) {
		return (pd as PersonalData).fullName!.trim() || 'Sin nombre';
	}
	return 'Sin nombre';
}

function toMinutes(time: string): number {
	const [h, m = '0'] = time.split(':');
	return Number(h) * 60 + Number(m);
}

function diffMinutes(start: string, end: string): number {
	return Math.max(0, toMinutes(end) - toMinutes(start));
}

export default function ScheduleManager() {
	const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
	const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
	const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
	const [editing, setEditing] = useState<EditableSchedule | null>(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [breakUserId, setBreakUserId] = useState<string>('');
	const [breakDate, setBreakDate] = useState<string>('');
	const [breakStart, setBreakStart] = useState<string>('12:00');
	const [breakEnd, setBreakEnd] = useState<string>('13:00');

	useEffect(() => {
		const load = async () => {
			const start = format(weekStart, 'yyyy-MM-dd');
			const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');

			const [profilesRes, schedulesRes] = await Promise.all([
				supabase.from('profiles').select('id, role, personal_data').order('id'),
				supabase
					.from('schedules')
					.select('*')
					.gte('scheduled_date', start)
					.lte('scheduled_date', end)
					.order('scheduled_date', { ascending: true }),
			]);

			if (profilesRes.data) setProfiles(profilesRes.data as ProfileWithRole[]);
			if (schedulesRes.data) setSchedules(schedulesRes.data as ScheduleRow[]);
		};
		load();
	}, [weekStart]);

	const days = useMemo(() => {
		return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
	}, [weekStart]);

	const scheduleByUserDate = useMemo(() => {
		const map = new Map<string, ScheduleRow>();
		schedules.forEach((s) => {
			map.set(`${s.user_id}-${s.scheduled_date}`, s);
		});
		return map;
	}, [schedules]);

	const openEdit = (userId: string, dateStr: string) => {
		const existing = scheduleByUserDate.get(`${userId}-${dateStr}`) as any;
		setEditing({
			id: existing?.id,
			user_id: userId,
			scheduled_date: dateStr,
			start_time: existing?.start_time ?? '08:00',
			end_time: existing?.end_time ?? '17:00',
			break_start: existing?.break_start ?? null,
			break_end: existing?.break_end ?? null,
		});
		setError(null);
	};

	const validateShift = (draft: EditableSchedule) => {
		const durationMinutes = diffMinutes(draft.start_time, draft.end_time);
		if (durationMinutes <= 0) return 'La hora de salida debe ser posterior a la de entrada.';
		if (durationMinutes > SHIFT_MAX_HOURS * 60) return 'El turno no puede exceder 10 horas.';

		const userSchedules = schedules
			.filter((s) => s.user_id === draft.user_id && s.scheduled_date !== draft.scheduled_date)
			.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

		const draftDate = parseISO(draft.scheduled_date);

		for (const s of userSchedules) {
			if (!s.start_time || !s.end_time) continue;
			const sDate = parseISO(s.scheduled_date);
			const sStart = new Date(sDate);
			const sEnd = new Date(sDate);
			const [sH, sM = '0'] = s.start_time.split(':');
			const [eH, eM = '0'] = s.end_time.split(':');
			sStart.setHours(Number(sH), Number(sM), 0, 0);
			sEnd.setHours(Number(eH), Number(eM), 0, 0);

			const draftStart = new Date(draftDate);
			const draftEnd = new Date(draftDate);
			const [dH, dM = '0'] = draft.start_time.split(':');
			const [dEH, dEM = '0'] = draft.end_time.split(':');
			draftStart.setHours(Number(dH), Number(dM), 0, 0);
			draftEnd.setHours(Number(dEH), Number(dEM), 0, 0);

			if (isBefore(draftStart, sEnd) && isAfter(draftEnd, sStart)) {
				return 'El turno se superpone con otro turno existente.';
			}

			const restHours = Math.abs(draftStart.getTime() - sEnd.getTime()) / 36e5;
			const restHoursAlt = Math.abs(sStart.getTime() - draftEnd.getTime()) / 36e5;
			if (restHours < REST_MIN_HOURS || restHoursAlt < REST_MIN_HOURS) {
				return 'Debe haber al menos 10 horas entre turnos.';
			}
		}

		return null;
	};

	const handleSave = async () => {
		if (!editing) return;
		try {
			const validationError = validateShift(editing);
			if (validationError) {
				setError(validationError);
				return;
			}

			setSaving(true);
			const payload = {
				id: editing.id,
				user_id: editing.user_id,
				scheduled_date: editing.scheduled_date,
				start_time: editing.start_time,
				end_time: editing.end_time,
				break_start: editing.break_start ?? null,
				break_end: editing.break_end ?? null,
			} as any;

			const { data, error: upsertError } = await supabase
				.from('schedules')
				.upsert(payload, { onConflict: 'user_id,scheduled_date' })
				.select('*')
				.single();

			if (upsertError) {
				setError(upsertError.message);
				return;
			}

			if (data) {
				setSchedules((prev) => {
					const filtered = prev.filter((s) => s.id !== data.id);
					return [...filtered, data as ScheduleRow].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
				});
			}

			setEditing(null);
			setError(null);
		} finally {
			setSaving(false);
		}
	};

	const saveBreakWindow = async () => {
		if (!breakUserId || !breakDate) {
			setError('Selecciona un empleado y un día.');
			return;
		}
		setSaving(true);
		setError(null);
		const existing = scheduleByUserDate.get(`${breakUserId}-${breakDate}`) as any;
		const payload = {
			id: existing?.id,
			user_id: breakUserId,
			scheduled_date: breakDate,
			start_time: existing?.start_time ?? '08:00',
			end_time: existing?.end_time ?? '17:00',
			break_start: breakStart,
			break_end: breakEnd,
		} as any;

		const { data, error: upsertError } = await supabase
			.from('schedules')
			.upsert(payload, { onConflict: 'user_id,scheduled_date' })
			.select('*')
			.single();

		if (upsertError) {
			setError(upsertError.message);
			setSaving(false);
			return;
		}

		if (data) {
			setSchedules((prev) => {
				const filtered = prev.filter((s) => s.id !== data.id);
				return [...filtered, data as ScheduleRow].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
			});
		}
		setSaving(false);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-gray-800">
					<Calendar className="w-5 h-5 text-[#FF8C00]" />
					<h2 className="text-lg font-bold">Gestión de Horarios</h2>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setWeekStart(addDays(weekStart, -7))}
						className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:border-[#FF8C00]/50"
					>
						Semana anterior
					</button>
					<button
						type="button"
						onClick={() => setWeekStart(addDays(weekStart, 7))}
						className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:border-[#FF8C00]/50"
					>
						Semana siguiente
					</button>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 py-3 text-left font-semibold text-gray-600">Empleado</th>
							{days.map((day) => (
								<th key={day.toISOString()} className="px-4 py-3 text-left font-semibold text-gray-600">
									{format(day, 'EEE dd/MM')}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{profiles.map((profile) => (
							<tr key={profile.id} className="border-t">
								<td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
									{getDisplayName(profile)}
								</td>
								{days.map((day) => {
									const dateStr = format(day, 'yyyy-MM-dd');
									const sched = scheduleByUserDate.get(`${profile.id}-${dateStr}`) as any;
									return (
										<td key={dateStr} className="px-4 py-3">
											<button
												type="button"
												onClick={() => openEdit(profile.id, dateStr)}
												className="w-full text-left rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-2 hover:border-[#FF8C00]/50"
											>
												<div className="flex items-center justify-between text-xs text-gray-500">
													<span>{sched?.start_time ?? '--:--'} – {sched?.end_time ?? '--:--'}</span>
													<Edit3 className="w-3 h-3" />
												</div>
												{sched?.break_start && sched?.break_end && (
													<div className="mt-1 text-[11px] text-[#FF8C00] font-semibold">
														Break {sched.break_start} – {sched.break_end}
													</div>
												)}
											</button>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Break Windows */}
			<div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
				<div className="flex items-center gap-2 mb-4">
					<Clock className="w-5 h-5 text-[#FF8C00]" />
					<h3 className="text-lg font-bold text-gray-800">Break Windows</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<select
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
						value={breakUserId}
						onChange={(e) => setBreakUserId(e.target.value)}
					>
						<option value="">Selecciona empleado</option>
						{profiles.map((p) => (
							<option key={p.id} value={p.id}>
								{getDisplayName(p)}
							</option>
						))}
					</select>
					<input
						type="date"
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
						value={breakDate}
						onChange={(e) => setBreakDate(e.target.value)}
					/>
					<input
						type="time"
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
						value={breakStart}
						onChange={(e) => setBreakStart(e.target.value)}
					/>
					<input
						type="time"
						className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
						value={breakEnd}
						onChange={(e) => setBreakEnd(e.target.value)}
					/>
				</div>
				<div className="mt-4">
					<button
						type="button"
						onClick={saveBreakWindow}
						disabled={saving}
						className="inline-flex items-center gap-2 rounded-xl bg-[#FF8C00] px-4 py-2 text-white font-semibold hover:bg-orange-600 disabled:opacity-70"
					>
						<Save className="w-4 h-4" /> Guardar ventana
					</button>
				</div>
			</div>

			{/* Edit Modal */}
			{editing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold">Editar Turno</h3>
							<button type="button" onClick={() => setEditing(null)}>
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-gray-500">Fecha</label>
								<p className="text-sm font-semibold text-gray-800">{editing.scheduled_date}</p>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-gray-500">Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
										value={editing.start_time}
										onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-500">Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
										value={editing.end_time}
										onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-gray-500">Break Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
										value={editing.break_start ?? ''}
										onChange={(e) => setEditing({ ...editing, break_start: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-500">Break Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
										value={editing.break_end ?? ''}
										onChange={(e) => setEditing({ ...editing, break_end: e.target.value })}
									/>
								</div>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setEditing(null)}
								className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#FF8C00] px-4 py-2 text-white font-semibold hover:bg-orange-600 disabled:opacity-70"
							>
								<Save className="w-4 h-4" /> Guardar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
