"use server";

import { createClient } from "@/lib/supabase/server";

export type PayrollPreviewRow = {
  id: string;
  name: string | null;
  role: string | null;
  salary: number | null;
  minute_rate: number | null;
  minutes_worked: number;
  total_pay: number;
};

type AttendanceLog = {
  user_id: string;
  state?: string | null;
  type?: string | null;
  created_at: string;
};

function getLogState(log: AttendanceLog): string {
  return log.state ?? log.type ?? "offline";
}

function isWorkingState(state: string): boolean {
  return state === "entrada" || state === "reunion";
}

export async function generatePayrollPreview(
  startDate: string,
  endDate: string
): Promise<PayrollPreviewRow[]> {
  if (!startDate || !endDate) {
    throw new Error("Selecciona fechas");
  }

  if (new Date(startDate) > new Date(endDate)) {
    throw new Error("Fecha inicio mayor que fin");
  }

  const supabase = await createClient();
  const startIso = new Date(`${startDate}T00:00:00`).toISOString();
  const endIso = new Date(`${endDate}T23:59:59`).toISOString();
  const endRangeMs = new Date(endIso).getTime();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, role, base_salary, minute_rate")
    .in("role", ["empleado", "supervisor"]);

  if (profilesError) {
    throw profilesError;
  }

  const { data: logs, error: logsError } = await supabase
    .from("attendance_logs")
    .select("user_id, state, type, created_at")
    .gte("created_at", startIso)
    .lte("created_at", endIso)
    .order("created_at", { ascending: true });

  if (logsError) {
    throw logsError;
  }

  const logsByUser = new Map<string, AttendanceLog[]>();
  (logs ?? []).forEach((log) => {
    if (!logsByUser.has(log.user_id)) {
      logsByUser.set(log.user_id, []);
    }
    logsByUser.get(log.user_id)!.push(log);
  });

  const report = (profiles ?? [])
    .map((emp) => {
      const userLogs = logsByUser.get(emp.id) ?? [];
      if (userLogs.length === 0) {
        return null;
      }

      userLogs.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let totalMinutes = 0;

      for (let i = 0; i < userLogs.length; i += 1) {
        const log = userLogs[i];
        const state = getLogState(log);
        const startMs = new Date(log.created_at).getTime();
        const nextLog = userLogs[i + 1];
        const endMs = nextLog ? new Date(nextLog.created_at).getTime() : endRangeMs;

        if (isWorkingState(state)) {
          const diffMs = Math.max(0, endMs - startMs);
          totalMinutes += diffMs / 60000;
        }
      }

      const baseSalary = emp.base_salary === null ? null : Number(emp.base_salary);
      const minuteRate = emp.minute_rate === null ? null : Number(emp.minute_rate);
      const minuteRateValue = minuteRate ?? 0;
      const totalPay = Math.round(totalMinutes * minuteRateValue * 100) / 100;

      return {
        id: emp.id,
        name: emp.full_name ?? null,
        role: emp.role ?? null,
        salary: baseSalary,
        minute_rate: minuteRate,
        minutes_worked: Math.floor(totalMinutes),
        total_pay: totalPay,
      } as PayrollPreviewRow;
    })
    .filter((row): row is PayrollPreviewRow => !!row && row.minutes_worked > 0);

  return report;
}
