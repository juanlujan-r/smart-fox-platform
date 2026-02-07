'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Phone, Calendar, FileText, AlertTriangle, Clock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useEmployeeModal } from '@/context/EmployeeModalContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface EmployeeDetailModalProps {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  userRole: string;
}

interface EmployeeMetrics {
  totalConnections: number;
  lastConnection: string | null;
  totalCallTime: number;
  totalPermissions: number;
  pendingPermissions: number;
  disciplinaryActions: any[];
  schedules: any[];
  novedades: any[];
  attendanceLogs: any[];
  cargo?: string;
  supervisor_name?: string;
}

export default function EmployeeDetailModal({
  employeeId,
  employeeName,
  onClose,
  userRole,
}: EmployeeDetailModalProps) {
  const { closeModal } = useEmployeeModal();
  const [metrics, setMetrics] = useState<EmployeeMetrics>({
    totalConnections: 0,
    lastConnection: null,
    totalCallTime: 0,
    totalPermissions: 0,
    pendingPermissions: 0,
    disciplinaryActions: [],
    schedules: [],
    novedades: [],
    attendanceLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [showDisciplinaryForm, setShowDisciplinaryForm] = useState(false);
  const [formData, setFormData] = useState({
    faultName: '',
    faultType: 'advertencia',
    incidentDate: '',
    incidentTime: '',
    description: '',
    attachmentUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    loadEmployeeMetrics();
  }, [employeeId]);

  const loadEmployeeMetrics = async () => {
    try {
      setLoading(true);

      // Use PostgreSQL function to get all metrics in a single query
      // This eliminates N+1 query problem and improves performance
      const { data: metricsData, error } = await supabase
        .rpc('get_employee_metrics', { employee_id: employeeId });

      if (error) throw error;

      if (metricsData) {
        setMetrics({
          totalConnections: metricsData.totalConnections || 0,
          lastConnection: metricsData.lastConnection || null,
          totalCallTime: metricsData.totalCallTime || 0,
          totalPermissions: metricsData.totalPermissions || 0,
          pendingPermissions: metricsData.pendingPermissions || 0,
          disciplinaryActions: metricsData.disciplinaryActions || [],
          schedules: metricsData.schedules || [],
          novedades: [], // Not included in function, can be added if needed
          attendanceLogs: metricsData.attendanceLogs || [],
          cargo: metricsData.cargo || '',
          supervisor_name: metricsData.supervisorName || '',
        });
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      pushToast('Error al cargar métricas del empleado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDisciplinaryAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.faultName || !formData.incidentDate) {
      pushToast('Por favor completa los campos requeridos', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const { data: currentUser } = await supabase.auth.getUser();

      const { error } = await (supabase.from('disciplinary_actions') as any).insert({
        user_id: employeeId,
        created_by: currentUser.user?.id,
        type: formData.faultType,
        description: `${formData.faultName}\n\nFecha y hora: ${formData.incidentDate} ${formData.incidentTime || 'No especificada'}\n\n${formData.description}`,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
      });

      if (error) throw error;

      pushToast('Falta disciplinaria registrada exitosamente', 'success');
      setFormData({
        faultName: '',
        faultType: 'advertencia',
        incidentDate: '',
        incidentTime: '',
        description: '',
        attachmentUrl: '',
      });
      setShowDisciplinaryForm(false);
      loadEmployeeMetrics();
    } catch (error: any) {
      pushToast(`Error: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información del empleado...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{employeeName}</h2>
            <p className="text-sm text-gray-500 mt-1">ID: {employeeId.substring(0, 8)}</p>
            {(metrics.cargo || metrics.supervisor_name) && (
              <div className="flex gap-4 mt-2 text-sm">
                {metrics.cargo && (
                  <div>
                    <span className="text-gray-500">Cargo:</span>
                    <span className="text-gray-900 font-semibold ml-2">{metrics.cargo}</span>
                  </div>
                )}
                {metrics.supervisor_name && (
                  <div>
                    <span className="text-gray-500">Supervisor:</span>
                    <span className="text-gray-900 font-semibold ml-2">{metrics.supervisor_name}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-blue-600">Conexiones</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{metrics.totalConnections}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-green-600" />
                <p className="text-xs font-bold text-green-600">Tiempo Llamadas</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {Math.floor(metrics.totalCallTime / 3600)}h
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-orange-600" />
                <p className="text-xs font-bold text-orange-600">Permisos</p>
              </div>
              <p className="text-2xl font-bold text-orange-900">{metrics.totalPermissions}</p>
              <p className="text-xs text-orange-600 mt-1">
                {metrics.pendingPermissions} pendiente(s)
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-xs font-bold text-red-600">Faltas</p>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {metrics.disciplinaryActions.length}
              </p>
            </div>
          </div>

          {/* Last Connection */}
          {metrics.lastConnection && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm font-semibold text-gray-700">Última conexión</p>
              <p className="text-lg text-gray-900 mt-1">
                {format(parseISO(metrics.lastConnection), 'd MMM yyyy, HH:mm', { locale: es })}
              </p>
            </div>
          )}

          {/* Disciplinary Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-bold text-gray-900">Procesos Disciplinarios</h3>
              </div>
              {(userRole === 'supervisor' || userRole === 'gerente') && (
                <button
                  onClick={() => setShowDisciplinaryForm(!showDisciplinaryForm)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                  Añadir Falta
                </button>
              )}
            </div>

            {showDisciplinaryForm && (
              <form onSubmit={handleAddDisciplinaryAction} className="bg-red-50 p-4 rounded-xl mb-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre de la falta"
                    value={formData.faultName}
                    onChange={(e) =>
                      setFormData({ ...formData, faultName: e.target.value })
                    }
                    className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <select
                    value={formData.faultType}
                    onChange={(e) =>
                      setFormData({ ...formData, faultType: e.target.value })
                    }
                    className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="advertencia">Advertencia</option>
                    <option value="suspension">Suspensión</option>
                    <option value="sancion">Sanción</option>
                    <option value="terminacion">Terminación</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) =>
                      setFormData({ ...formData, incidentDate: e.target.value })
                    }
                    className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                  <input
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) =>
                      setFormData({ ...formData, incidentTime: e.target.value })
                    }
                    className="px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <textarea
                  placeholder="Descripción del suceso"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition disabled:opacity-70"
                  >
                    {submitting ? 'Registrando...' : 'Registrar Falta'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDisciplinaryForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-bold transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {metrics.disciplinaryActions.length > 0 ? (
              <div className="space-y-3">
                {metrics.disciplinaryActions.map((action) => (
                  <div
                    key={action.id}
                    className="border border-red-200 bg-red-50 p-4 rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-red-900 capitalize">{action.type}</p>
                        <p className="text-sm text-gray-700 mt-1">{action.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(parseISO(action.created_at), 'd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      {action.has_hearing && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                          Con audiencia
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Sin procesos disciplinarios registrados
              </p>
            )}
          </div>

          {/* Pending Permissions */}
          {metrics.pendingPermissions > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Permisos Pendientes ({metrics.pendingPermissions})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.novedades.map((perm) => (
                  <div
                    key={perm.id}
                    className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-sm"
                  >
                    <p className="font-semibold text-orange-900">{perm.title}</p>
                    <p className="text-xs text-gray-600">
                      {format(parseISO(perm.start_date), 'd MMM', { locale: es })} -{' '}
                      {format(parseISO(perm.end_date), 'd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Schedules */}
          {metrics.schedules.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Horarios (Próximos 30 días)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.schedules.slice(0, 10).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold text-blue-900">
                        {format(parseISO(schedule.scheduled_date), 'd MMM yyyy', {
                          locale: es,
                        })}
                      </p>
                      <p className="text-xs text-gray-600">
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                      {schedule.shift_type || 'Regular'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              Resumen de Asistencia (Últimos 10 registros)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metrics.attendanceLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {(log as any).state || (log as any).type || 'Desconocido'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(log.created_at), 'd MMM yyyy, HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-2">
          <button
            onClick={closeModal}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-bold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
