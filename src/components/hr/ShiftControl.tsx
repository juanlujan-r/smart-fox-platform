"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/ToastContext";

type LogRecord = {
  id?: string;
  user_id?: string;
  type: string;
  created_at?: string;
};

export default function ShiftControl() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lastLog, setLastLog] = useState<LogRecord | null>(null);
  const [alerted, setAlerted] = useState(false);
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const intervalRef = useRef<number | null>(null);

  async function fetchLastLog() {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) return setLastLog(null);

      const { data, error } = await supabase
        .from("attendance_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("fetchLastLog error", error);
        pushToast("Error fetching last log");
        return;
      }

      setLastLog(data ?? null);
      setAlerted(false);
    } catch (err) {
      console.error(err);
    }
  }

  async function logEvent(type: string) {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        pushToast("No authenticated user.");
        return;
      }

      const payload: Record<string, any> = { user_id: userId, type };
      if (notes) payload.notes = notes;
      if (location) payload.location = location;

      const { error } = await supabase.from("attendance_logs").insert([payload]);
      if (error) {
        console.error("insert error", error);
        pushToast("Error saving attendance: " + (error.message ?? ""));
        return;
      }

      // Refresh last log after insert
      await fetchLastLog();

      if (type === "Offline") {
        setLastLog(null);
      }

      pushToast(`${type} recorded`);
    } finally {
      setLoading(false);
    }
  }

  // Check active session and alert if > 8 hours
  // fetch once on mount
  useEffect(() => {
    fetchLastLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // timer to check active Entrada sessions
  useEffect(() => {
    function checkTimer() {
      if (!lastLog) return;
      if (lastLog.type !== "Entrada") return;

      const start = new Date(lastLog.created_at ?? "");
      if (Number.isNaN(start.getTime())) return;
      const elapsed = Date.now() - start.getTime();
      const eightHours = 8 * 60 * 60 * 1000;
      if (elapsed > eightHours && !alerted) {
        setAlerted(true);
        pushToast("Session exceeded 8 hours — please check your shift.");
      }
    }

    checkTimer();
    intervalRef.current = window.setInterval(checkTimer, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLog, alerted]);

  const buttonClass =
    "bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded px-4 py-2 shadow-sm";

  return (
    <div className="max-w-md mx-auto bg-white/6 border border-white/10 backdrop-blur-md rounded-lg p-6">
      <h3 className="text-lg font-bold mb-3">Control de Turno</h3>

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          className={buttonClass}
          onClick={() => logEvent("Offline")}
          disabled={loading}
        >
          Offline
        </button>

        <button
          className={buttonClass}
          onClick={() => logEvent("Entrada")}
          disabled={loading}
        >
          Entrada
        </button>

        <button
          className={buttonClass}
          onClick={() => logEvent("Descanso")}
          disabled={loading}
        >
          Descanso
        </button>

        <button
          className={buttonClass}
          onClick={() => logEvent("Almuerzo")}
          disabled={loading}
        >
          Almuerzo
        </button>

        <button
          className={buttonClass}
          onClick={() => logEvent("Reunión")}
          disabled={loading}
        >
          Reunión
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          className="flex-1 rounded px-3 py-2 bg-white/5 border border-white/10 text-sm"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ubicación (opcional)"
          className="w-40 rounded px-3 py-2 bg-white/5 border border-white/10 text-sm"
        />
      </div>

      <div className="text-sm text-gray-300">
        <div>Último registro: {lastLog ? `${lastLog.type} — ${new Date(lastLog.created_at ?? "").toLocaleString()}` : "Ninguno"}</div>
      </div>
    </div>
  );
}
