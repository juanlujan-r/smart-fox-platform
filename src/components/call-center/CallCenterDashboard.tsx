/**
 * CALL CENTER DASHBOARD - Supervisor/Manager View
 * Dashboard con estadísticas, agentes, colas y llamadas
 */

'use client';

import React, { useState, useEffect } from 'react';
import * as supabaseService from '@/lib/call-center/supabase';
import { AgentProfile, CallRecord } from '@/lib/call-center/supabase';

export function CallCenterDashboard() {
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Get available agents
            const agentsList = await supabaseService.getAvailableAgents();
            setAgents(agentsList);

            // Get call center stats
            const statsData = await supabaseService.getCallCenterStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgentSelect = async (agentId: string) => {
        setSelectedAgent(agentId);
        // Load agent's call history
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    📊 Centro de Llamadas Dashboard
                </h1>
                <p className="text-gray-600">Monitoreo en tiempo real de operaciones</p>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Agents Available */}
                    <div className="bg-green-50 rounded-lg border-2 border-green-200 p-4">
                        <p className="text-sm text-gray-600">Agentes Disponibles</p>
                        <p className="text-3xl font-bold text-green-600">
                            {stats?.agents_available || 0}
                        </p>
                    </div>

                    {/* Agents Busy */}
                    <div className="bg-red-50 rounded-lg border-2 border-red-200 p-4">
                        <p className="text-sm text-gray-600">Agentes Ocupados</p>
                        <p className="text-3xl font-bold text-red-600">
                            {stats?.agents_busy || 0}
                        </p>
                    </div>

                    {/* Active Calls */}
                    <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4">
                        <p className="text-sm text-gray-600">Llamadas Activas</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {stats?.calls_active || 0}
                        </p>
                    </div>

                    {/* Calls in Queue */}
                    <div className="bg-yellow-50 rounded-lg border-2 border-yellow-200 p-4">
                        <p className="text-sm text-gray-600">Llamadas en Cola</p>
                        <p className="text-3xl font-bold text-yellow-600">
                            {stats?.calls_queued || 0}
                        </p>
                    </div>
                </div>

                {/* Agents List */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            👥 Equipo de Agentes
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Extensión
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Llamadas Activas
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Total Manejadas
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Tiempo Promedio
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {agents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No hay agentes disponibles
                                        </td>
                                    </tr>
                                ) : (
                                    agents.map((agent) => (
                                        <tr key={agent.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono font-semibold text-gray-900">
                                                {agent.extension}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                                    agent.agent_status === 'available'
                                                        ? 'bg-green-100 text-green-700'
                                                        : agent.agent_status === 'busy'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {agent.agent_status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {agent.current_call_count} / {agent.max_concurrent_calls}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {agent.total_calls_handled}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {Math.round(agent.average_handling_time_seconds / 60)} min
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleAgentSelect(agent.id)}
                                                    className="text-blue-600 hover:text-blue-900 font-semibold"
                                                >
                                                    Ver Detalles
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Call Records */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            📞 Llamadas Recientes
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Número
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Duración
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Grabación
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                        Fecha
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {callRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                            No hay llamadas registradas
                                        </td>
                                    </tr>
                                ) : (
                                    callRecords.map((call) => (
                                        <tr key={call.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-gray-900">
                                                {call.caller_number}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {call.call_direction === 'inbound' ? '📥 Entrada' : '📤 Salida'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-sm font-semibold ${
                                                    call.call_status === 'completed'
                                                        ? 'text-green-600'
                                                        : 'text-yellow-600'
                                                }`}>
                                                    {call.call_status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {call.duration_seconds}s
                                            </td>
                                            <td className="px-6 py-4">
                                                {call.recording_url ? (
                                                    <a
                                                        href={call.recording_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        🔊 Escuchar
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(call.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CallCenterDashboard;
