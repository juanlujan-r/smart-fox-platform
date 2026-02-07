'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, parseISO, isBefore, isAfter } from 'date-fns';
import { Calendar, Clock, Edit3, Save, X, Copy } from 'lucide-react';
import type { ScheduleRow } from '@/types/database';
import type { PersonalData } from '@/types/database';

type ProfileWithRole = { id: string; role?: string; personal_data?: PersonalData | null; full_name?: string };

type EditableSchedule = {
	id?: string;
	user_id: string;
	scheduled_date: string;
	start_time: string;
	end_time: string;
	break_start?: string | null;
	break_end?: string | null;
};

type BulkSchedule = {
	user_id: string;
	start_time: string;
	end_time: string;
	break_start?: string;
	break_end?: string;
	days: number; // 3, 4, 5, 7 para toda la semana
};

const SHIFT_MAX_HOURS = 10;
const REST_MIN_HOURS = 10;

function getDisplayName(profile: ProfileWithRole): string {
	if (profile.full_name) return profile.full_name.trim() || 'Sin nombre';
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
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Bulk assignment states
	const [showBulkModal, setShowBulkModal] = useState(false);
	const [bulkSchedule, setBulkSchedule] = useState<BulkSchedule>({
		user_id: '',
		start_time: '08:00',
		end_time: '17:00',
		break_start: '12:00',
		break_end: '13:00',
		days: 5,
	});
	
	// Manual multi-day selection
	const [showManualModal, setShowManualModal] = useState(false);
	const [selectedDates, setSelectedDates] = useState<string[]>([]);
	const [manualSchedule, setManualSchedule] = useState({
		user_id: '',
		start_time: '08:00',
		end_time: '17:00',
		break_start: '12:00',
		break_end: '13:00',
	});

	const [breakUserId, setBreakUserId] = useState<string>('');
	const [breakDate, setBreakDate] = useState<string>('');
	const [breakStart, setBreakStart] = useState<string>('12:00');
	const [breakEnd, setBreakEnd] = useState<string>('13:00');

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				setError(null);
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

				if (profilesRes.error) {
					console.error('Error loading profiles:', profilesRes.error);
					setError('Error al cargar empleados: ' + profilesRes.error.message);
				}
				if (schedulesRes.error) {
					console.error('Error loading schedules:', schedulesRes.error);
					setError('Error al cargar horarios: ' + schedulesRes.error.message);
				}

				if (profilesRes.data) setProfiles(profilesRes.data as ProfileWithRole[]);
				if (schedulesRes.data) setSchedules(schedulesRes.data as ScheduleRow[]);
			} catch (err: unknown) {
				console.error('Error in load:', err);
				setError('Error al cargar datos: ' + ((err as Error).message || 'Intente de nuevo'));
			} finally {
				setLoading(false);
			}
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
		const existing = scheduleByUserDate.get(`${userId}-${dateStr}`);
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
			setError(null);
			const payload = {
				user_id: editing.user_id,
				scheduled_date: editing.scheduled_date,
				start_time: editing.start_time,
				end_time: editing.end_time,
				break_start: editing.break_start ?? null,
				break_end: editing.break_end ?? null,
			};

			// Delete existing schedule for this user on this date
			const { error: deleteError } = await supabase
				.from('schedules')
				.delete()
				.eq('user_id', editing.user_id)
				.eq('scheduled_date', editing.scheduled_date);

			if (deleteError) {
				console.error('Error deleting schedule:', deleteError);
				setError('Error al guardar: ' + deleteError.message);
				return;
			}

			// Insert new schedule
			const { data, error: insertError } = await supabase
				.from('schedules')
				.insert([payload])
				.select('*')
				.single();

			if (insertError) {
				console.error('Error inserting schedule:', insertError);
				setError('Error al guardar: ' + insertError.message);
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
		} catch (err: unknown) {
			console.error('Error in handleSave:', err);
			setError('Error al guardar: ' + ((err as Error).message || 'Intente de nuevo'));
		} finally {
			setSaving(false);
		}
	};

	const saveBreakWindow = async () => {
		if (!breakUserId || !breakDate) {
			setError('Selecciona un empleado y un día.');
			return;
		}
		try {
			setSaving(true);
			setError(null);
			const existing = scheduleByUserDate.get(`${breakUserId}-${breakDate}`);
			
			// Delete existing schedule for this user on this date
			const { error: deleteError } = await supabase
				.from('schedules')
				.delete()
				.eq('user_id', breakUserId)
				.eq('scheduled_date', breakDate);

			if (deleteError) {
				console.error('Error deleting break:', deleteError);
				setError('Error al guardar: ' + deleteError.message);
				return;
			}

			const payload = {
				user_id: breakUserId,
				scheduled_date: breakDate,
				start_time: existing?.start_time ?? '08:00',
				end_time: existing?.end_time ?? '17:00',
				break_start: breakStart,
				break_end: breakEnd,
			};

			const { data, error: insertError } = await supabase
				.from('schedules')
				.insert([payload])
				.select('*')
				.single();

			if (insertError) {
				console.error('Error inserting break window:', insertError);
				setError('Error al guardar: ' + insertError.message);
				return;
			}

			if (data) {
				setSchedules((prev) => {
					const filtered = prev.filter((s) => s.id !== data.id);
					return [...filtered, data as ScheduleRow].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
				});
			}
		} catch (err: unknown) {
			console.error('Error in saveBreakWindow:', err);
			setError('Error al guardar: ' + ((err as Error).message || 'Intente de nuevo'));
		} finally {
			setSaving(false);
		}
	};

	const handleBulkAssignment = async () => {
		if (!bulkSchedule.user_id) {
			setError('Selecciona un empleado');
			return;
		}

		try {
			setSaving(true);
			setError(null);

			const schedulesToCreate = [];
			const startDate = weekStart;
			
			for (let i = 0; i < bulkSchedule.days; i++) {
				const date = format(addDays(startDate, i), 'yyyy-MM-dd');
				schedulesToCreate.push({
					user_id: bulkSchedule.user_id,
					scheduled_date: date,
					start_time: bulkSchedule.start_time,
					end_time: bulkSchedule.end_time,
					break_start: bulkSchedule.break_start || null,
					break_end: bulkSchedule.break_end || null,
				});
			}

			const { data, error: upsertError } = await supabase
				.from('schedules')
				.upsert(schedulesToCreate, { onConflict: 'user_id,scheduled_date' })
				.select('*');

			if (upsertError) {
				setError('Error al guardar horarios: ' + upsertError.message);
				return;
			}

			if (data) {
				setSchedules((prev) => {
					const idsToRemove = new Set(data.map(d => d.id));
					const filtered = prev.filter(s => !idsToRemove.has(s.id));
					return [...filtered, ...(data as ScheduleRow[])].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
				});
			}

			setShowBulkModal(false);
			setError(null);
		} catch (err: unknown) {
			setError('Error al guardar: ' + ((err as Error).message || 'Intente de nuevo'));
		} finally {
			setSaving(false);
		}
	};

	const handleManualAssignment = async () => {
		if (!manualSchedule.user_id || selectedDates.length === 0) {
			setError('Selecciona un empleado y al menos un día');
			return;
		}

		try {
			setSaving(true);
			setError(null);

			const schedulesToCreate = selectedDates.map(date => ({
				user_id: manualSchedule.user_id,
				scheduled_date: date,
				start_time: manualSchedule.start_time,
				end_time: manualSchedule.end_time,
				break_start: manualSchedule.break_start || null,
				break_end: manualSchedule.break_end || null,
			}));

			const { data, error: upsertError } = await supabase
				.from('schedules')
				.upsert(schedulesToCreate, { onConflict: 'user_id,scheduled_date' })
				.select('*');

			if (upsertError) {
				setError('Error al guardar horarios: ' + upsertError.message);
				return;
			}

			if (data) {
				setSchedules((prev) => {
					const idsToRemove = new Set(data.map(d => d.id));
					const filtered = prev.filter(s => !idsToRemove.has(s.id));
					return [...filtered, ...(data as ScheduleRow[])].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
				});
			}

			setShowManualModal(false);
			setSelectedDates([]);
			setError(null);
		} catch (err: unknown) {
			setError('Error al guardar: ' + ((err as Error).message || 'Intente de nuevo'));
		} finally {
			setSaving(false);
		}
	};

	const toggleDateSelection = (date: string) => {
		setSelectedDates(prev => 
			prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-gray-900">
					<Calendar className="w-5 h-5 text-[#FF8C00]" />
					<h2 className="text-lg font-bold">Gestión de Horarios</h2>
					{loading && <span className="text-xs text-gray-500">(Cargando...)</span>}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setShowBulkModal(true)}
						className="px-4 py-2 rounded-lg bg-[#FF8C00] text-white text-sm font-semibold hover:bg-orange-600 flex items-center gap-2"
					>
						<Copy className="w-4 h-4" />
						Asignar Múltiples Días
					</button>
					<button
						type="button"
						onClick={() => setShowManualModal(true)}
						className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
					>
						<Calendar className="w-4 h-4" />
						Selección Manual
					</button>
					<button
						type="button"
						onClick={() => setWeekStart(addDays(weekStart, -7))}
						className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:border-[#FF8C00]/50"
					>
						← Anterior
					</button>
					<button
						type="button"
						onClick={() => setWeekStart(addDays(weekStart, 7))}
						className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold hover:border-[#FF8C00]/50"
					>
						Siguiente →
					</button>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
				<table className="min-w-full text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-4 py-3 text-left font-semibold text-gray-700">Empleado</th>
							{days.map((day) => (
								<th key={day.toISOString()} className="px-4 py-3 text-left font-semibold text-gray-700">
									{format(day, 'EEE dd/MM')}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{profiles.map((profile) => (
							<tr key={profile.id} className="border-t border-gray-100 hover:bg-gray-50">
								<td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
									{getDisplayName(profile)}
								</td>
								{days.map((day) => {
									const dateStr = format(day, 'yyyy-MM-dd');
								const sched = scheduleByUserDate.get(`${profile.id}-${dateStr}`);
									return (
										<td key={dateStr} className="px-4 py-3">
											<button
												type="button"
												onClick={() => openEdit(profile.id, dateStr)}
												className="w-full text-left rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 hover:border-[#FF8C00] hover:bg-orange-50 transition"
											>
												<div className="flex items-center justify-between text-xs text-gray-600">
													<span>{sched?.start_time ?? '--:--'} – {sched?.end_time ?? '--:--'}</span>
													<Edit3 className="w-3 h-3 text-gray-400" />
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
			<div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
				<div className="flex items-center gap-2 mb-4">
					<Clock className="w-5 h-5 text-[#FF8C00]" />
					<h3 className="text-lg font-bold text-gray-900">Break Windows</h3>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<select
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
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
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
						value={breakDate}
						onChange={(e) => setBreakDate(e.target.value)}
					/>
					<input
						type="time"
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
						value={breakStart}
						onChange={(e) => setBreakStart(e.target.value)}
					/>
					<input
						type="time"
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
						value={breakEnd}
						onChange={(e) => setBreakEnd(e.target.value)}
					/>
				</div>
				<div className="mt-4">
					<button
						type="button"
						onClick={saveBreakWindow}
						disabled={saving}
						className="inline-flex items-center gap-2 rounded-xl bg-[#FF8C00] px-4 py-2 text-white font-semibold hover:bg-orange-600 disabled:opacity-70 transition"
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
							<h3 className="text-lg font-bold text-gray-900">Editar Turno</h3>
							<button type="button" onClick={() => setEditing(null)}>
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-xs font-semibold text-gray-700">Fecha</label>
								<p className="text-sm font-semibold text-gray-900">{editing.scheduled_date}</p>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-gray-700">Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={editing.start_time}
										onChange={(e) => setEditing({ ...editing, start_time: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-700">Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={editing.end_time}
										onChange={(e) => setEditing({ ...editing, end_time: e.target.value })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-xs font-semibold text-gray-700">Break Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={editing.break_start ?? ''}
										onChange={(e) => setEditing({ ...editing, break_start: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-gray-700">Break Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
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
								className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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

			{/* Bulk Assignment Modal */}
			{showBulkModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-gray-900">Asignar Horario a Múltiples Días</h3>
							<button type="button" onClick={() => setShowBulkModal(false)}>
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-semibold text-gray-700 mb-2 block">Empleado</label>
								<select
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
									value={bulkSchedule.user_id}
									onChange={(e) => setBulkSchedule({ ...bulkSchedule, user_id: e.target.value })}
								>
									<option value="">Selecciona un empleado</option>
									{profiles.map((p) => (
										<option key={p.id} value={p.id}>
											{getDisplayName(p)}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-sm font-semibold text-gray-700 mb-2 block">Cantidad de Días (desde el inicio de la semana)</label>
								<div className="grid grid-cols-4 gap-2">
									{[3, 4, 5, 7].map(num => (
										<button
											key={num}
											type="button"
											onClick={() => setBulkSchedule({ ...bulkSchedule, days: num })}
											className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
												bulkSchedule.days === num
													? 'bg-[#FF8C00] text-white'
													: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
											}`}
										>
											{num === 7 ? 'Toda semana' : `${num} días`}
										</button>
									))}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Hora Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={bulkSchedule.start_time}
										onChange={(e) => setBulkSchedule({ ...bulkSchedule, start_time: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Hora Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={bulkSchedule.end_time}
										onChange={(e) => setBulkSchedule({ ...bulkSchedule, end_time: e.target.value })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Break Inicio (opcional)</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={bulkSchedule.break_start}
										onChange={(e) => setBulkSchedule({ ...bulkSchedule, break_start: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Break Fin (opcional)</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] outline-none"
										value={bulkSchedule.break_end}
										onChange={(e) => setBulkSchedule({ ...bulkSchedule, break_end: e.target.value })}
									/>
								</div>
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowBulkModal(false)}
								className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleBulkAssignment}
								disabled={saving}
								className="inline-flex items-center gap-2 rounded-lg bg-[#FF8C00] px-4 py-2 text-white font-semibold hover:bg-orange-600 disabled:opacity-70"
							>
								<Save className="w-4 h-4" /> Asignar
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Manual Multi-Day Selection Modal */}
			{showManualModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
					<div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-bold text-gray-900">Selección Manual de Días</h3>
							<button type="button" onClick={() => { setShowManualModal(false); setSelectedDates([]); }}>
								<X className="w-5 h-5 text-gray-500" />
							</button>
						</div>
						<div className="space-y-4">
							<div>
								<label className="text-sm font-semibold text-gray-700 mb-2 block">Empleado</label>
								<select
									className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
									value={manualSchedule.user_id}
									onChange={(e) => setManualSchedule({ ...manualSchedule, user_id: e.target.value })}
								>
									<option value="">Selecciona un empleado</option>
									{profiles.map((p) => (
										<option key={p.id} value={p.id}>
											{getDisplayName(p)}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="text-sm font-semibold text-gray-700 mb-2 block">Selecciona Días (haz clic para marcar/desmarcar)</label>
								<div className="grid grid-cols-4 gap-2">
									{days.map(day => {
										const dateStr = format(day, 'yyyy-MM-dd');
										const isSelected = selectedDates.includes(dateStr);
										return (
											<button
												key={dateStr}
												type="button"
												onClick={() => toggleDateSelection(dateStr)}
												className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
													isSelected
														? 'bg-blue-600 text-white'
														: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
												}`}
											>
												<div>{format(day, 'EEE')}</div>
												<div className="text-xs">{format(day, 'dd/MM')}</div>
											</button>
										);
									})}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Hora Inicio</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										value={manualSchedule.start_time}
										onChange={(e) => setManualSchedule({ ...manualSchedule, start_time: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Hora Fin</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										value={manualSchedule.end_time}
										onChange={(e) => setManualSchedule({ ...manualSchedule, end_time: e.target.value })}
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Break Inicio (opcional)</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										value={manualSchedule.break_start}
										onChange={(e) => setManualSchedule({ ...manualSchedule, break_start: e.target.value })}
									/>
								</div>
								<div>
									<label className="text-sm font-semibold text-gray-700 mb-1 block">Break Fin (opcional)</label>
									<input
										type="time"
										className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
										value={manualSchedule.break_end}
										onChange={(e) => setManualSchedule({ ...manualSchedule, break_end: e.target.value })}
									/>
								</div>
							</div>
							<div className="text-sm text-gray-600">
								Días seleccionados: {selectedDates.length}
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-3">
							<button
								type="button"
								onClick={() => { setShowManualModal(false); setSelectedDates([]); }}
								className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={handleManualAssignment}
								disabled={saving || selectedDates.length === 0}
								className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
							>
								<Save className="w-4 h-4" /> Asignar ({selectedDates.length} días)
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
