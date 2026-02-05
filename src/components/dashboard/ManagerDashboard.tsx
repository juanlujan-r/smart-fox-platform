"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, DollarSign, TrendingUp, AlertCircle, 
  Calendar, CheckCircle, XCircle, Download 
} from 'lucide-react';
// import * as XLSX from 'xlsx'; // Descomentar cuando instales xlsx

// Definición simple para evitar errores de TS
interface EmployeeProfile {
  id: string;
  full_name: string;
  role: string;
}

interface RequestType {
  id: number;
  type: string;
  status: string;
  user_id: string;
}

export default function ManagerDashboard({ userRole }: { userRole: string }) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeNow: 0,
    pendingRequests: 0,
    monthlyPayroll: 0
  });
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Empleados
      const { count: empCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. Activos Ahora (Log más reciente no es offline)
      // Nota: Esto es una simplificación. Para precisión exacta se requiere lógica compleja, 
      // por ahora mostramos un estimado basado en logs del día.
      const today = new Date();
      today.setHours(0,0,0,0);
      const { count: activeCount } = await supabase
        .from('attendance_logs')
        .select('*', { count: 'exact', head: true })
        .eq('state', 'entrada')
        .gte('created_at', today.toISOString());

      // 3. Solicitudes Pendientes
      const { data: reqs, count: reqCount } = await supabase
        .from('hr_requests')
        .select('id, type, status, user_id')
        .eq('status', 'pendiente');

      setStats({
        totalEmployees: empCount || 0,
        activeNow: activeCount || 0,
        pendingRequests: reqCount || 0,
        monthlyPayroll: (empCount || 0) * 1500000 // Estimado ejemplo
      });
      
      if (reqs) setRequests(reqs);
      
    } catch (error) {
      console.error("Error loading dashboard", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        
        {/* Solo Gerentes ven Dinero */}
        {userRole === 'gerente' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Nómina Est.</p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-2">
                  ${(stats.monthlyPayroll / 1000000).toFixed(1)}M
                </h3>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}

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

      {/* SECCIÓN INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LISTA DE SOLICITUDES */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Solicitudes Pendientes
          </h3>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-gray-400">No hay solicitudes pendientes.</p>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <div>
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-200 capitalize">{req.type}</p>
                    <p className="text-xs text-gray-400">ID Usuario: {req.user_id.substring(0,8)}...</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase rounded">
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Placeholder para Gráfica de Ventas (Solo Gerentes) */}
        {userRole === 'gerente' && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center">
                <TrendingUp className="w-12 h-12 text-gray-200 mb-2" />
                <h3 className="text-lg font-bold text-gray-400">Rendimiento Financiero</h3>
                <p className="text-xs text-gray-400">Gráficas disponibles próximamente</p>
            </div>
        )}
      </div>
    </div>
  );
}
