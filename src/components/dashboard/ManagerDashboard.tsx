"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, AlertCircle, CheckCircle, 
  Calendar, DollarSign, Clock, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PayrollStats {
  totalPayroll: number;
  averageSalary: number;
  employeesWithSalary: number;
}

interface ShiftHistoryLog {
  id: string;
  user_id: string;
  state?: string | null;
  created_at?: string | null;
  employee_name?: string | null;
}

interface HrRequest {
  id: string;
  type?: string | null;
  status?: string | null;
  user_id?: string | null;
}

export default function ManagerDashboard({ userRole }: { userRole: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeNow: 0,
    pendingRequests: 0
  });
  const [shiftHistory, setShiftHistory] = useState<ShiftHistoryLog[]>([]);
  const [requests, setRequests] = useState<HrRequest[]>([]);
  const [payrollStats, setPayrollStats] = useState<PayrollStats>({
    totalPayroll: 0,
    averageSalary: 0,
    employeesWithSalary: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Empleados
      const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. Activos Ahora (Log más reciente no es offline)
      const today = new Date();
      today.setHours(0,0,0,0);
      const { count: activeCount } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'entrada')
        .gte('created_at', today.toISOString());

      // 3. Solicitudes Pendientes
      const { data: reqs = [] } = await supabase
        .from('hr_requests')
        .select('id, type, status, user_id')
        .eq('status', 'pendiente');

      // 4. Payroll Summary - Supervisors and Managers only
      let payroll = {
        totalPayroll: 0,
        averageSalary: 0,
        employeesWithSalary: 0
      };
      
      if (userRole === 'supervisor' || userRole === 'gerente') {
        const { data: employees = [], error: empError } = await supabase
          .from('profiles')
          .select('base_salary')
          .gt('base_salary', 0);
        
        if (!empError && employees?.length > 0) {
          const totalSalary = employees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
          payroll = {
            totalPayroll: totalSalary,
            averageSalary: totalSalary / employees.length,
            employeesWithSalary: employees.length
          };
        } else if (empError) {
          console.error('Error fetching payroll data:', empError);
        }
      }

      // 5. Shift History - Last 15 attendance logs with employee info
      if (userRole === 'supervisor' || userRole === 'gerente') {
        const { data: logs = [], error: logsError } = await supabase
          .from('attendance_logs')
          .select('id, user_id, state, created_at')
          .order('created_at', { ascending: false })
          .limit(15);
        
        if (!logsError && logs?.length > 0) {
          // Fetch employee names for these logs
          const userIds = [...new Set(logs.map(log => log.user_id))];
          const { data: profiles = [], error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);
          
          if (!profileError && profiles?.length > 0) {
            const profileMap = new Map(profiles.map(p => [p.id, p.full_name]));
            
            const logsWithNames = logs.map(log => ({
              ...log,
              employee_name: profileMap.get(log.user_id) || 'Desconocido'
            }));
            
            setShiftHistory(logsWithNames);
          } else {
            setShiftHistory(logs.map(log => ({
              ...log,
              employee_name: 'Desconocido'
            })));
          }
        } else if (logsError) {
          console.error('Error fetching shift history:', logsError);
          setShiftHistory([]);
        }
      }

      setStats({
        totalEmployees: empCount || 0,
        activeNow: activeCount || 0,
        pendingRequests: reqs?.length || 0
      });
      setPayrollStats(payroll);
      setRequests(reqs || []);
      
    } catch (error) {
      console.error("Error loading dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total Empleados</p>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">{stats.totalEmployees}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Activos Ahora</p>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">{stats.activeNow}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Solicitudes</p>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">{stats.pendingRequests}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* PAYROLL SECTION - Managers Only */}
      {userRole === 'gerente' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Nómina Total</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">
                  ${payrollStats.totalPayroll.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-xs text-gray-400 mt-2">{payrollStats.employeesWithSalary} empleados</p>
              </div>
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Salario Promedio</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">
                  ${payrollStats.averageSalary.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                </h3>
                <p className="text-xs text-gray-400 mt-2">Por empleado</p>
              </div>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Costo por Minuto</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">
                  ${(payrollStats.totalPayroll / (payrollStats.employeesWithSalary * 12600) || 0).toFixed(2)}
                </h3>
                <p className="text-xs text-gray-400 mt-2">Ley 2101 (12600 min/mes)</p>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT HISTORY SECTION - Admin Users Only */}
      {(userRole === 'supervisor' || userRole === 'gerente') && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Historial de Turnos Recientes
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {!shiftHistory || shiftHistory.length === 0 ? (
              <p className="text-sm text-gray-400">No hay registros de turnos.</p>
            ) : (
              shiftHistory.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getStateColor(log.state || 'offline')}`}></div>
                    <div>
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-200">{log.employee_name || 'Desconocido'}</p>
                      <p className="text-xs text-gray-400">
                        {log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: es }) : 'Fecha desconocida'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded">
                    {getStateLabel(log.state || 'offline')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN INFERIOR */}
      <div>
        {/* LISTA DE SOLICITUDES */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Solicitudes Pendientes
          </h3>
          <div className="space-y-3">
            {!requests || requests.length === 0 ? (
              <p className="text-sm text-gray-400">No hay solicitudes pendientes.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-200 capitalize">{req.type || 'novedad'}</p>
                    <p className="text-xs text-gray-400">ID Usuario: {req.user_id?.substring(0,8) || 'desconocido'}...</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded">
                    {req.status || 'pendiente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function getStateLabel(state: string): string {
    const labels: Record<string, string> = {
      entrada: 'Entrada',
      descanso: 'Descanso',
      almuerzo: 'Almuerzo',
      reunion: 'Reunión',
      offline: 'Desconectado'
    };
    return labels[state] || state;
  }

  function getStateColor(state: string): string {
    const colors: Record<string, string> = {
      entrada: 'bg-green-500',
      descanso: 'bg-blue-500',
      almuerzo: 'bg-yellow-500',
      reunion: 'bg-purple-500',
      offline: 'bg-gray-500'
    };
    return colors[state] || 'bg-gray-500';
  }
}
