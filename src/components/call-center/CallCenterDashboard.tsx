/**
 * CALL CENTER DASHBOARD - Supervisor/Manager View
 * Dashboard con estadísticas, agentes, colas y llamadas
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as supabaseService from '@/lib/call-center/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { AgentProfile, CallRecord } from '@/lib/call-center/supabase';

export function CallCenterDashboard() {
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
    const [agentCallHistory, setAgentCallHistory] = useState<CallRecord[]>([]);

    const [showCharts, setShowCharts] = useState(false);
    const [chartData, setChartData] = useState<any[]>([]);
    const [callStatusData, setCallStatusData] = useState<any[]>([]);

    const [dashboardPrefs, setDashboardPrefs] = useState({
        showStats: true,
        showCharts: true,
        showAgents: true,
        showCalls: true,
        showAlerts: true,
        showReports: true,
    });
    const [alertConfig, setAlertConfig] = useState({
        minAvailableAgents: 2,
        maxMissedCalls: 3,
        maxAvgHandleMin: 8,
    });
    const [alerts, setAlerts] = useState<string[]>([]);
    const [reportSchedule, setReportSchedule] = useState({
        enabled: false,
        frequency: 'daily',
        time: '09:00',
        lastRun: '',
    });

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Get all agents
            const agentsList = await supabaseService.getAllAgents();
            setAgents(agentsList);

            // Get recent calls
            const recentCalls = await supabaseService.getRecentCalls(50);
            setCallRecords(recentCalls);

            // Get call center stats
            const statsData = await supabaseService.getCallCenterStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgentSelect = async (agent: AgentProfile) => {
        setSelectedAgent(agent);
        
        try {
            // Load agent's call history
            const history = await supabaseService.getAgentCallHistory(agent.id, 50);
            setAgentCallHistory(history);
        } catch (error) {
            console.error('Error loading agent history:', error);
        }
    };

    const generateChartData = useCallback(() => {
        if (agents.length === 0) return;

        // Data for agent performance chart
        const perfData = agents.slice(0, 10).map(a => ({
            name: `Ext ${a.extension}`,
            calls: a.total_calls_handled,
            avgTime: Math.round(a.average_handling_time_seconds / 60),
        }));
        setChartData(perfData);

        // Data for call status pie chart
        const statusData = [
            { name: 'Completadas', value: Number(stats?.calls_completed_today ?? 0) },
            { name: 'En curso', value: Number(stats?.calls_active ?? 0) + Number(stats?.calls_queued ?? 0) },
            { name: 'Pérdidas', value: Number(stats?.calls_missed_today ?? 0) },
        ];
        setCallStatusData(statusData);
        setShowCharts(true);
    }, [agents, stats]);

    const exportToExcel = useCallback(() => {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();

            // Agents sheet
            const agentsData = agents.map(a => ({
                'Extensión': a.extension,
                'Estado': a.agent_status,
                'Llamadas Activas': a.current_call_count,
                'Total Manejadas': a.total_calls_handled,
                'Tiempo Promedio (min)': Math.round(a.average_handling_time_seconds / 60),
            }));
            const wsAgents = XLSX.utils.json_to_sheet(agentsData);
            XLSX.utils.book_append_sheet(wb, wsAgents, 'Agentes');

            // Call records sheet
            const callsData = callRecords.map(c => ({
                'Número': c.caller_number,
                'Tipo': c.call_direction,
                'Estado': c.call_status,
                'Duración (s)': c.duration_seconds,
                'Fecha': new Date(c.created_at).toLocaleString('es-ES'),
            }));
            const wsCalls = XLSX.utils.json_to_sheet(callsData);
            XLSX.utils.book_append_sheet(wb, wsCalls, 'Llamadas');

            // Stats sheet
            const statsData = [
                {
                    'Métrica': 'Total Llamadas Hoy',
                    'Valor': Number(stats?.total_calls_today ?? 0),
                },
                {
                    'Métrica': 'Completadas Hoy',
                    'Valor': Number(stats?.calls_completed_today ?? 0),
                },
                {
                    'Métrica': 'En Curso',
                    'Valor': Number(stats?.calls_active ?? 0) + Number(stats?.calls_queued ?? 0),
                },
                {
                    'Métrica': 'Pérdidas hoy',
                    'Valor': Number(stats?.calls_missed_today ?? 0),
                },
                {
                    'Métrica': 'Agentes Disponibles',
                    'Valor': Number(stats?.agents_available ?? 0),
                },
                {
                    'Métrica': 'Agentes Ocupados',
                    'Valor': Number(stats?.agents_busy ?? 0),
                },
                {
                    'Métrica': 'Duración prom. (min)',
                    'Valor': Math.round(Number(stats?.avg_call_duration_today ?? 0) / 60),
                },
                {
                    'Métrica': 'Manejo prom. (min)',
                    'Valor': Math.round(Number(stats?.avg_handling_time ?? 0) / 60),
                }
            ];
            const wsStats = XLSX.utils.json_to_sheet(statsData);
            XLSX.utils.book_append_sheet(wb, wsStats, 'Estadísticas');

            // Save file
            const fileName = `reporte_callcenter_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        }
    }, [agents, callRecords, stats]);

    useEffect(() => {
        try {
            const savedPrefs = localStorage.getItem('cc_dashboard_prefs');
            const savedAlerts = localStorage.getItem('cc_alert_config');
            const savedSchedule = localStorage.getItem('cc_report_schedule');

            if (savedPrefs) setDashboardPrefs(JSON.parse(savedPrefs));
            if (savedAlerts) setAlertConfig(JSON.parse(savedAlerts));
            if (savedSchedule) setReportSchedule(JSON.parse(savedSchedule));
        } catch (error) {
            console.warn('Failed to load dashboard settings:', error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cc_dashboard_prefs', JSON.stringify(dashboardPrefs));
    }, [dashboardPrefs]);

    useEffect(() => {
        localStorage.setItem('cc_alert_config', JSON.stringify(alertConfig));
    }, [alertConfig]);

    useEffect(() => {
        localStorage.setItem('cc_report_schedule', JSON.stringify(reportSchedule));
    }, [reportSchedule]);

    useEffect(() => {
        if (!stats) {
            setAlerts([]);
            return;
        }

        const newAlerts: string[] = [];
        const available = Number(stats.agents_available ?? 0);
        const missed = Number(stats.calls_missed_today ?? 0);
        const avgHandleMin = Math.round(Number(stats.avg_handling_time ?? 0) / 60);

        if (available < alertConfig.minAvailableAgents) {
            newAlerts.push(`Pocos agentes disponibles: ${available}`);
        }

        if (missed > alertConfig.maxMissedCalls) {
            newAlerts.push(`Demasiadas llamadas pérdidas hoy: ${missed}`);
        }

        if (avgHandleMin > alertConfig.maxAvgHandleMin) {
            newAlerts.push(`Tiempo promedio alto: ${avgHandleMin} min`);
        }

        setAlerts(newAlerts);
    }, [stats, alertConfig]);

    const isSameWeek = (a: Date, b: Date) => {
        const startOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = (date.getDay() + 6) % 7;
            date.setDate(date.getDate() - day);
            date.setHours(0, 0, 0, 0);
            return date;
        };
        return startOfWeek(a).getTime() === startOfWeek(b).getTime();
    };

    useEffect(() => {
        if (!dashboardPrefs.showReports || !reportSchedule.enabled) return;

        const checkSchedule = () => {
            const now = new Date();
            const [hours, minutes] = reportSchedule.time.split(':').map(Number);
            const scheduled = new Date(now);
            scheduled.setHours(hours, minutes, 0, 0);

            const lastRun = reportSchedule.lastRun ? new Date(reportSchedule.lastRun) : null;
            const isDailyDone = lastRun && lastRun.toDateString() === now.toDateString();
            const isWeeklyDone = lastRun && isSameWeek(lastRun, now);
            const dueByTime = now.getTime() >= scheduled.getTime();

            if (!dueByTime) return;

            if (reportSchedule.frequency === 'daily' && isDailyDone) return;
            if (reportSchedule.frequency === 'weekly' && isWeeklyDone) return;

            exportToExcel();
            setReportSchedule((prev) => ({
                ...prev,
                lastRun: now.toISOString(),
            }));
        };

        checkSchedule();
        const interval = setInterval(checkSchedule, 60000);
        return () => clearInterval(interval);
    }, [dashboardPrefs.showReports, reportSchedule, exportToExcel]);

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
                {dashboardPrefs.showAlerts && alerts.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-red-700 mb-2">⚠️ Alertas Activas</h3>
                        <ul className="text-sm text-red-700 space-y-1">
                            {alerts.map((alert, idx) => (
                                <li key={idx}>• {alert}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="text-xl font-bold text-gray-900">
                            ⚙️ Personalizar Dashboard
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Visibilidad</h3>
                            <div className="space-y-2 text-sm">
                                {(
                                    [
                                        { key: 'showStats', label: 'Estadísticas' },
                                        { key: 'showCharts', label: 'Gráficas' },
                                        { key: 'showAgents', label: 'Agentes' },
                                        { key: 'showCalls', label: 'Llamadas' },
                                        { key: 'showAlerts', label: 'Alertas' },
                                        { key: 'showReports', label: 'Reportes' },
                                    ] as const
                                ).map((item) => (
                                    <label key={item.key} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={dashboardPrefs[item.key]}
                                            onChange={(e) =>
                                                setDashboardPrefs((prev) => ({
                                                    ...prev,
                                                    [item.key]: e.target.checked,
                                                }))
                                            }
                                        />
                                        {item.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">Alertas</h3>
                            <div className="space-y-2 text-sm">
                                <label className="block">
                                    Min. agentes disponibles
                                    <input
                                        type="number"
                                        min={0}
                                        value={alertConfig.minAvailableAgents}
                                        onChange={(e) =>
                                            setAlertConfig((prev) => ({
                                                ...prev,
                                                minAvailableAgents: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </label>
                                <label className="block">
                                    Máx. llamadas pérdidas (hoy)
                                    <input
                                        type="number"
                                        min={0}
                                        value={alertConfig.maxMissedCalls}
                                        onChange={(e) =>
                                            setAlertConfig((prev) => ({
                                                ...prev,
                                                maxMissedCalls: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </label>
                                <label className="block">
                                    Max. tiempo manejo (min)
                                    <input
                                        type="number"
                                        min={0}
                                        value={alertConfig.maxAvgHandleMin}
                                        onChange={(e) =>
                                            setAlertConfig((prev) => ({
                                                ...prev,
                                                maxAvgHandleMin: Number(e.target.value),
                                            }))
                                        }
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </label>
                            </div>
                        </div>

                        {dashboardPrefs.showReports && (
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">Reportes Programados</h3>
                                <div className="space-y-2 text-sm">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={reportSchedule.enabled}
                                            onChange={(e) =>
                                                setReportSchedule((prev) => ({
                                                    ...prev,
                                                    enabled: e.target.checked,
                                                }))
                                            }
                                        />
                                        Habilitar reportes
                                    </label>
                                    <label className="block">
                                        Frecuencia
                                        <select
                                            value={reportSchedule.frequency}
                                            onChange={(e) =>
                                                setReportSchedule((prev) => ({
                                                    ...prev,
                                                    frequency: e.target.value,
                                                }))
                                            }
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="daily">Diario</option>
                                            <option value="weekly">Semanal</option>
                                        </select>
                                    </label>
                                    <label className="block">
                                        Hora
                                        <input
                                            type="time"
                                            value={reportSchedule.time}
                                            onChange={(e) =>
                                                setReportSchedule((prev) => ({
                                                    ...prev,
                                                    time: e.target.value,
                                                }))
                                            }
                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </label>
                                    <button
                                        onClick={exportToExcel}
                                        className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg"
                                    >
                                        Generar reporte ahora
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* Stats Grid */}
                {dashboardPrefs.showStats && (
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
                )}

                {/* Charts Section */}
                {dashboardPrefs.showCharts && agents.length > 0 && (
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                📊 Análisis y Reportes
                            </h2>
                            <button
                                onClick={generateChartData}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                                {showCharts ? '🔄 Actualizar' : '📈 Mostrar Gráficas'}
                            </button>
                        </div>
                        {showCharts && (
                            <div className="p-6 space-y-6">
                                {/* Performance Chart */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Desempeño de Agentes</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="calls" fill="#3b82f6" name="Llamadas" />
                                            <Bar dataKey="avgTime" fill="#10b981" name="Tiempo Prom (min)" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Call Status Pie Chart */}
                                {callStatusData.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Estado de Llamadas</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={callStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {callStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Agents List */}
                {dashboardPrefs.showAgents && (
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
                                                        onClick={() => handleAgentSelect(agent)}
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
                )}

                {/* Call Records */}
                {dashboardPrefs.showCalls && (
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
                )}
            </div>

            {/* Agent Details Modal */}
            {selectedAgent && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold">Detalles del Agente</h2>
                                    <p className="text-orange-100 mt-1">Extensión: {selectedAgent.extension}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedAgent(null)}
                                    className="text-white hover:text-orange-200 text-2xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {/* Agent Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 uppercase">Estado</p>
                                    <p className={`text-lg font-bold mt-1 ${
                                        selectedAgent.agent_status === 'available' ? 'text-green-600' :
                                        selectedAgent.agent_status === 'busy' ? 'text-red-600' :
                                        'text-gray-600'
                                    }`}>
                                        {selectedAgent.agent_status.toUpperCase()}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 uppercase">Llamadas Activas</p>
                                    <p className="text-lg font-bold mt-1 text-gray-900">
                                        {selectedAgent.current_call_count} / {selectedAgent.max_concurrent_calls}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 uppercase">Total Manejadas</p>
                                    <p className="text-lg font-bold mt-1 text-gray-900">
                                        {selectedAgent.total_calls_handled}
                                    </p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-600 uppercase">Tiempo Promedio</p>
                                    <p className="text-lg font-bold mt-1 text-gray-900">
                                        {Math.round(selectedAgent.average_handling_time_seconds / 60)} min
                                    </p>
                                </div>
                            </div>

                            {/* Skills */}
                            {selectedAgent.skills && Object.keys(selectedAgent.skills).length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-bold text-gray-900 mb-2">🎯 Habilidades</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(selectedAgent.skills).map(([skill, enabled]) => (
                                            enabled && (
                                                <span
                                                    key={skill}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold"
                                                >
                                                    {skill}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Call History */}
                            <div>
                                <h3 className="font-bold text-gray-900 mb-3">📞 Historial de Llamadas</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="max-h-64 overflow-y-auto">
                                        {agentCallHistory.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No hay llamadas registradas
                                            </div>
                                        ) : (
                                            <table className="min-w-full">
                                                <thead className="bg-gray-50 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                            Número
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                            Tipo
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                            Estado
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                            Duración
                                                        </th>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                                                            Fecha
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {agentCallHistory.map((call) => (
                                                        <tr key={call.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                                                                {call.caller_number}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm">
                                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                                    call.call_direction === 'inbound'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-purple-100 text-purple-700'
                                                                }`}>
                                                                    {call.call_direction === 'inbound' ? 'Entrante' : 'Saliente'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                                {call.call_status}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                                {call.duration_seconds}s
                                                            </td>
                                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                                {new Date(call.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <button
                                onClick={() => setSelectedAgent(null)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CallCenterDashboard;
