'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  Headphones,
  Activity,
  PhoneForwarded,
  PhoneOff,
  Mic,
  Play,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  AgentProfile,
  CallRecord,
  createAgentProfile,
  getAgentCallHistory,
  getCallCenterStats,
} from '@/lib/call-center/supabase';
import { useCallCenter } from '@/hooks/call-center/useCallCenter';

type Role = 'empleado' | 'supervisor' | 'gerente';

type AgentStatusCounts = {
  available: number;
  busy: number;
  break: number;
  offline: number;
};

type CallStats = {
  total: number;
  completed: number;
  in_progress: number;
  missed: number;
};

const emptyAgentCounts: AgentStatusCounts = { available: 0, busy: 0, break: 0, offline: 0 };
const emptyCallStats: CallStats = { total: 0, completed: 0, in_progress: 0, missed: 0 };

export default function CallCenterPage() {
  const {
    agentProfile,
    agentStatus,
    updateAgentStatus,
    currentCall,
    isCallActive,
    startCall,
    endCall,
    transferCall,
    loading: callLoading,
    error: callError,
    success: callSuccess,
  } = useCallCenter();

  const [role, setRole] = useState<Role>('empleado');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentCounts, setAgentCounts] = useState<AgentStatusCounts>(emptyAgentCounts);
  const [callStats, setCallStats] = useState<CallStats>(emptyCallStats);
  const [dataError, setDataError] = useState<string | null>(null);
  const [agentList, setAgentList] = useState<AgentProfile[]>([]);
  const [liveCalls, setLiveCalls] = useState<CallRecord[]>([]);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transferNumber, setTransferNumber] = useState('');

  useEffect(() => {
    const loadRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole((profile?.role as Role) ?? 'empleado');
      } catch (err) {
        console.error('Error loading role:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, []);

  const loadStats = async () => {
    try {
      const stats = await getCallCenterStats();
      if (stats) {
        setAgentCounts({
          available: Number(stats.agents_available ?? 0),
          busy: Number(stats.agents_busy ?? 0),
          break: 0,
          offline: 0,
        });
        setCallStats({
          total: Number(stats.calls_active ?? 0) + Number(stats.calls_queued ?? 0),
          completed: 0,
          in_progress: Number(stats.calls_active ?? 0),
          missed: 0,
        });
      }
    } catch (err) {
      console.warn('Stats view not available:', err);
    }
  };

  const loadSupervisorData = async () => {
    try {
      const agentsRes = await supabase
        .from('call_center_agents')
        .select('*')
        .order('agent_status', { ascending: true });

      if (agentsRes.error) throw agentsRes.error;
      setAgentList((agentsRes.data ?? []) as AgentProfile[]);

      const counts = (agentsRes.data ?? []).reduce<AgentStatusCounts>((acc, a: any) => {
        const status = (a.agent_status || 'offline') as keyof AgentStatusCounts;
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, { ...emptyAgentCounts });
      setAgentCounts(counts);

      const liveRes = await supabase
        .from('call_records')
        .select('*')
        .in('call_status', ['active', 'ringing', 'queued'])
        .order('created_at', { ascending: false })
        .limit(20);

      if (liveRes.error) throw liveRes.error;
      setLiveCalls((liveRes.data ?? []) as CallRecord[]);

      const completedRes = await supabase
        .from('call_records')
        .select('call_status', { count: 'exact', head: false })
        .limit(500);

      if (!completedRes.error) {
        const calls = completedRes.data ?? [];
        const stats = calls.reduce<CallStats>((acc, c: any) => {
          const status = (c.call_status || 'completed') as string;
          acc.total += 1;
          if (status === 'completed') acc.completed += 1;
          else if (status === 'active' || status === 'ringing' || status === 'queued') acc.in_progress += 1;
          else if (status === 'missed' || status === 'failed' || status === 'no_answer') acc.missed += 1;
          return acc;
        }, { ...emptyCallStats });
        setCallStats(stats);
      }
    } catch (err) {
      console.error('Call center data load error:', err);
      setDataError('No hay datos de llamadas configurados en la base de datos.');
    }
  };

  useEffect(() => {
    if (role === 'supervisor' || role === 'gerente') {
      loadSupervisorData();
      loadStats();
      const interval = setInterval(() => {
        loadSupervisorData();
        loadStats();
      }, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [role]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!agentProfile?.id) return;
      try {
        const history = await getAgentCallHistory(agentProfile.id, 20);
        setCallHistory(history);
      } catch (err) {
        console.error('Error loading call history:', err);
      }
    };
    loadHistory();
  }, [agentProfile?.id, isCallActive]);

  const roleLabel = useMemo(() => {
    const map: Record<Role, string> = {
      empleado: 'Empleado',
      supervisor: 'Supervisor',
      gerente: 'Gerente',
    };
    return map[role] ?? role;
  }, [role]);

  const createAgent = async () => {
    if (!userId) return;
    try {
      const ext = userId.replace(/-/g, '').slice(-4);
      await createAgentProfile(userId, ext || '1000', { general: true });
      window.location.reload();
    } catch (err) {
      console.error('Error creating agent profile:', err);
      setDataError('No se pudo crear el perfil de agente.');
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Centro de Llamadas</h1>
          <p className="text-gray-600 mt-2">
            Vista por rol: <span className="font-semibold">{roleLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-gray-500">Estado</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {agentStatus}
          </span>
        </div>
      </header>

      {dataError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          {dataError}
        </div>
      )}

      {(callError || callSuccess) && (
        <div className={`rounded-xl p-4 text-sm ${callError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'}`}>
          {callError || callSuccess}
        </div>
      )}

      {!agentProfile && role !== 'gerente' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          Tu perfil de agente no esta configurado. Contacta a un gerente para activarlo.
        </div>
      )}

      {!agentProfile && role === 'gerente' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-900">Activar perfil de agente</h2>
          <p className="text-sm text-gray-600 mt-2">
            Para hacer/recibir/transferir llamadas debes tener un perfil de agente.
          </p>
          <button
            type="button"
            onClick={createAgent}
            className="mt-4 bg-[#FF8C00] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-orange-600"
          >
            Crear perfil de agente
          </button>
        </div>
      )}

      {/* Global stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <PhoneCall className="w-5 h-5 text-[#FF8C00]" />
            <span className="text-xs uppercase font-bold tracking-wide">Total llamadas</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{callStats.total}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <PhoneIncoming className="w-5 h-5 text-green-600" />
            <span className="text-xs uppercase font-bold tracking-wide">Completadas</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{callStats.completed}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="text-xs uppercase font-bold tracking-wide">En curso</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{callStats.in_progress}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-600">
            <PhoneMissed className="w-5 h-5 text-red-600" />
            <span className="text-xs uppercase font-bold tracking-wide">Pérdidas</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{callStats.missed}</div>
        </div>
      </section>

      {(role === 'empleado' || role === 'supervisor') && agentProfile && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Operación</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Ej: +573001234567"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => startCall(phoneNumber)}
                disabled={!phoneNumber || callLoading}
                className="w-full bg-[#FF8C00] text-white py-2.5 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-60"
              >
                Iniciar llamada
              </button>
              <button
                type="button"
                onClick={endCall}
                disabled={!isCallActive || callLoading}
                className="w-full bg-red-600 text-white py-2.5 rounded-xl font-bold hover:bg-red-700 disabled:opacity-60"
              >
                Finalizar llamada
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Transferencia</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Número destino</label>
                <input
                  value={transferNumber}
                  onChange={(e) => setTransferNumber(e.target.value)}
                  placeholder="Ej: +573009876543"
                  className="mt-1 w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => transferCall(transferNumber)}
                disabled={!transferNumber || !isCallActive || callLoading}
                className="w-full bg-slate-600 text-white py-2.5 rounded-xl font-bold hover:bg-slate-700 disabled:opacity-60"
              >
                Transferir
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Estado de Agente</h2>
            <div className="grid grid-cols-2 gap-2">
              {['available', 'busy', 'break', 'offline'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateAgentStatus(s)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border ${agentStatus === s ? 'bg-[#FF8C00]/10 border-[#FF8C00] text-[#FF8C00]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {currentCall && (
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-[#FF8C00]" /> Llamada activa</div>
                <div className="mt-1">Estado: {currentCall.call_status}</div>
                <div>Contacto: {currentCall.caller_number}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {(role === 'empleado' || role === 'supervisor') && agentProfile && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-gray-800 mb-3">
            <Headphones className="w-5 h-5 text-[#FF8C00]" />
            <h2 className="text-lg font-bold">Historial de llamadas</h2>
          </div>
          {callHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay llamadas registradas.</p>
          ) : (
            <div className="space-y-2">
              {callHistory.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.caller_number}</p>
                    <p className="text-xs text-gray-500">{c.call_status} • {c.call_direction}</p>
                  </div>
                  <div className="text-xs text-gray-500">{c.duration_seconds || 0}s</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {role === 'supervisor' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-gray-800 mb-3">
              <Users className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Agentes</h2>
            </div>
            {agentList.length === 0 ? (
              <p className="text-sm text-gray-500">No hay agentes registrados.</p>
            ) : (
              <div className="space-y-2">
                {agentList.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Ext. {a.extension}</p>
                      <p className="text-xs text-gray-500">{a.agent_status} • llamadas: {a.current_call_count}</p>
                    </div>
                    <span className="text-xs text-gray-500">{a.phone_number || 'sin tel.'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 text-gray-800 mb-3">
              <Mic className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Llamadas en vivo</h2>
            </div>
            {liveCalls.length === 0 ? (
              <p className="text-sm text-gray-500">No hay llamadas activas.</p>
            ) : (
              <div className="space-y-2">
                {liveCalls.map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-100 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.caller_number}</p>
                        <p className="text-xs text-gray-500">{c.call_status} • {c.queue_name || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-600 text-white"
                          onClick={() => window.alert('Función de escucha en vivo en configuración.')}
                        >
                          Chuzar
                        </button>
                        {c.recording_url ? (
                          <a
                            href={c.recording_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8C00] text-white"
                          >
                            Grabación
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-200 text-gray-500"
                            disabled
                          >
                            Sin audio
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {role === 'gerente' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Estadísticas Generales</h2>
            <p className="text-sm text-gray-600">Indicadores consolidados del centro de llamadas.</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Agentes Conectados</h2>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.available}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Ocupados</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.busy}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">En pausa</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.break}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Desconectados</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.offline}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {(role === 'empleado' || role === 'supervisor') && (
        <section className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Headphones className="w-5 h-5 text-orange-300" />
            <h2 className="text-lg font-bold">Operación en Vivo</h2>
          </div>
          <p className="text-sm text-gray-300">
            Conexión con agentes, enrutamiento y control de llamadas activas.
          </p>
        </section>
      )}
    </div>
  );
}
