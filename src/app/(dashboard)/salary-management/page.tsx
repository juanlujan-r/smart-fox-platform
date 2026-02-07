"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Save, X, AlertCircle, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import RoleGuard from '@/components/RoleGuard';

interface EmployeeWithSalary {
  id: string;
  full_name: string;
  cargo: string;
  base_salary: number;
  minute_rate: number;
}

interface SalaryAudit {
  id: string;
  employee_id: string;
  old_salary: number;
  new_salary: number;
  change_reason: string;
  changed_by_id: string;
  created_at: string;
  profiles: { full_name: string };
}

export default function SalaryManagementPage() {
  const { t, isClient } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeWithSalary[]>([]);
  const [auditTrail, setAuditTrail] = useState<SalaryAudit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState('');
  const [changeReason, setChangeReason] = useState('');
   const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load employees
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id, full_name, cargo, base_salary, minute_rate')
        .order('full_name');

      setEmployees(employeesData || []);

      // Load audit trail
      const { data: auditData } = await supabase
        .from('salary_audit')
        .select(`
          id,
          employee_id,
          old_salary,
          new_salary,
          change_reason,
          changed_by_id,
          created_at,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      setAuditTrail(auditData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (employee: EmployeeWithSalary) => {
    setEditingId(employee.id);
    setNewSalary(employee.base_salary.toString());
    setChangeReason('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewSalary('');
      setEffectiveDate(new Date().toISOString().split('T')[0]);
    setChangeReason('');
  };

  const saveSalaryChange = async (employeeId: string, oldSalary: number) => {
    if (!newSalary || parseFloat(newSalary) <= 0) {
      setMessage(t('amount') + ' ' + t('required'));
      return;
    }

    if (!changeReason.trim()) {
      setMessage(t('reason') + ' ' + t('required'));

         if (!effectiveDate) {
           setMessage('Fecha efectiva requerida');
           return;
         }
      return;
    }

    try {
      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Begin transaction: update salary and create audit record
      const salaryAmount = parseFloat(newSalary);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ base_salary: salaryAmount })
        .eq('id', employeeId);

      if (updateError) throw updateError;

      // Create audit record
      const { error: auditError } = await supabase
        .from('salary_audit')
        .insert({
          employee_id: employeeId,
          old_salary: oldSalary,
          new_salary: salaryAmount,
          change_reason: changeReason,
          changed_by_id: user.id,
        });

      if (auditError) throw auditError;

      setMessage(t('salaryUpdated'));
      setEditingId(null);
      setNewSalary('');
      setChangeReason('');

      // Reload data
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      console.error('Error saving salary change:', err);
      setMessage(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <RoleGuard allowedRoles={['gerente']}>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('salaryManagement')}</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('éxito') || message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Employees Salary List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">{t('employee')} {t('baseSalary')}</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('fullName')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('currentPosition')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('baseSalary')}</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">Minute Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{employee.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{employee.cargo || 'N/A'}</td>
                      <td className="px-6 py-4">
                        {editingId === employee.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">$</span>
                            <input
                              type="number"
                              value={newSalary}
                              onChange={(e) => setNewSalary(e.target.value)}
                              className="w-32 px-3 py-1 rounded border border-gray-300 text-sm"
                              min="0"
                              step="1000"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            ${employee.base_salary.toLocaleString('es-CO')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        ${employee.minute_rate.toLocaleString('es-CO', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === employee.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveSalaryChange(employee.id, employee.base_salary)}
                              disabled={saving}
                              className="p-1 bg-green-100 text-green-600 hover:bg-green-200 rounded disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={saving}
                              className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(employee)}
                            className="p-1 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Form */}
        {editingId && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900">{t('updateSalary')}</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Ingresa el motivo del cambio de salario para mantener un registro de auditoría.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('reason')} *
                </label>
                <textarea
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  disabled={saving}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Ejemplo: Promoción a gerente, Aumento por desempeño, Ajuste salarial..."
                             <div>
                               <label className="block text-sm font-semibold text-gray-700 mb-2">
                                 Fecha Efectiva del Cambio *
                               </label>
                               <input
                                 type="date"
                                 value={effectiveDate}
                                 onChange={(e) => setEffectiveDate(e.target.value)}
                                 disabled={saving}
                                 className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                               />
                               <p className="text-xs text-gray-500 mt-1">
                                 Fecha a partir de la cual el nuevo salario será efectivo
                               </p>
                             </div>
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => saveSalaryChange(editingId, employees.find(e => e.id === editingId)?.base_salary || 0)}
                  disabled={saving || !changeReason.trim()}
                  className="flex-1 bg-[#FF8C00] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {saving ? t('saving') : t('save')}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('salaryAudit')}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('employee')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('previousSalary')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('newSalary')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('reason')}</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600">{t('createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((audit) => (
                  <tr key={audit.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{audit.profiles?.full_name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      ${audit.old_salary?.toLocaleString('es-CO') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      ${audit.new_salary?.toLocaleString('es-CO') || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{audit.change_reason || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(audit.created_at).toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {auditTrail.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {t('no_bonuses')} (Hint: Este es el primer cambio)
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
