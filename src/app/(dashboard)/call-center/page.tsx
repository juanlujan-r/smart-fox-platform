'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  Headphones,
  Activity,
} from 'lucide-react';

type Role = 'empleado' | 'supervisor' | 'gerente';

type AgentStatusCounts = {
  available: number;
  in_call: number;
  offline: number;
};

type CallStats = {
  total: number;
  completed: number;
  in_progress: number;
  missed: number;
};

const emptyAgentCounts: AgentStatusCounts = { available: 0, in_call: 0, offline: 0 };
const emptyCallStats: CallStats = { total: 0, completed: 0, in_progress: 0, missed: 0 };

export default function CallCenterPage() {
  const [role, setRole] = useState<Role>('empleado');
  const [loading, setLoading] = useState(true);
  const [agentCounts, setAgentCounts] = useState<AgentStatusCounts>(emptyAgentCounts);
  const [callStats, setCallStats] = useState<CallStats>(emptyCallStats);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setRole((profile?.role as Role) ?? 'empleado');

        // Optional data sources (may not exist in DB)
        const [agentsRes, callsRes] = await Promise.allSettled([
          supabase.from('call_center_agents').select('agent_status', { count: 'exact', head: false }),
          supabase.from('call_records').select('call_status', { count: 'exact', head: false }),
        ]);

        if (agentsRes.status === 'fulfilled' && !agentsRes.value.error) {
          const agents = agentsRes.value.data || [];
          const counts = agents.reduce<AgentStatusCounts>((acc, a: any) => {
            const status = (a.agent_status || 'offline') as keyof AgentStatusCounts;
            if (acc[status] === undefined) acc.offline += 1;
            else acc[status] += 1;
            return acc;
          }, { ...emptyAgentCounts });
          setAgentCounts(counts);
        }

        if (callsRes.status === 'fulfilled' && !callsRes.value.error) {
          const calls = callsRes.value.data || [];
          const stats = calls.reduce<CallStats>((acc, c: any) => {
            const status = (c.call_status || 'completed') as string;
            acc.total += 1;
            if (status === 'completed') acc.completed += 1;
            else if (status === 'in_progress' || status === 'ringing') acc.in_progress += 1;
            else if (status === 'missed' || status === 'failed') acc.missed += 1;
            return acc;
          }, { ...emptyCallStats });
          setCallStats(stats);
        }

        if (
          (agentsRes.status === 'fulfilled' && agentsRes.value.error) ||
          (callsRes.status === 'fulfilled' && callsRes.value.error)
        ) {
          setDataError('No hay datos de llamadas configurados en la base de datos.');
        }
      } catch (err) {
        console.error('Call center load error:', err);
        setDataError('No se pudieron cargar los datos de llamadas.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const roleLabel = useMemo(() => {
    const map: Record<Role, string> = {
      empleado: 'Empleado',
      supervisor: 'Supervisor',
      gerente: 'Gerente',
    };
    return map[role] ?? role;
  }, [role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Centro de Llamadas</h1>
          <p className="text-gray-600 mt-2">
            Vista por rol: <span className="font-semibold">{roleLabel}</span>
          </p>
        </div>
      </header>

      {dataError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          {dataError}
        </div>
      )}

      {/* Global Stats */}
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
            <span className="text-xs uppercase font-bold tracking-wide">Perdidas</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mt-2">{callStats.missed}</div>
        </div>
      </section>

      {/* Role-based panels */}
      {(role === 'empleado' || role === 'supervisor') && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Funciones de Llamadas</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2"><PhoneOutgoing className="w-4 h-4 text-[#FF8C00]" /> Hacer llamadas</li>
              <li className="flex items-center gap-2"><PhoneIncoming className="w-4 h-4 text-green-600" /> Recibir llamadas</li>
              <li className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-blue-600" /> Transferir llamadas</li>
            </ul>
          </div>
          {role === 'supervisor' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Agentes en Llamada</h2>
                <p className="text-sm text-gray-600">
                  Panel para monitoreo en tiempo real y estado de agentes.
                </p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Grabaciones y Llamadas en Vivo</h2>
                <p className="text-sm text-gray-600">
                  Acceso a grabaciones y escucha en vivo (supervisión).
                </p>
              </div>
            </>
          )}
        </section>
      )}

      {role === 'gerente' && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Estadísticas Generales</h2>
            <p className="text-sm text-gray-600">
              Indicadores consolidados del centro de llamadas.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Agentes Conectados</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Disponibles</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.available}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">En llamada</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.in_call}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Desconectados</p>
                <p className="text-2xl font-black text-gray-900">{agentCounts.offline}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Supervisor-only summary */}
      {role === 'supervisor' && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 text-gray-800 mb-3">
            <Users className="w-5 h-5 text-[#FF8C00]" />
            <h2 className="text-lg font-bold">Estado de Agentes</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Disponibles</p>
              <p className="text-2xl font-black text-gray-900">{agentCounts.available}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">En llamada</p>
              <p className="text-2xl font-black text-gray-900">{agentCounts.in_call}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Desconectados</p>
              <p className="text-2xl font-black text-gray-900">{agentCounts.offline}</p>
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
