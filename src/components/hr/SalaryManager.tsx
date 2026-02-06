"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Save, RefreshCw, X, Lock } from 'lucide-react';

export default function SalaryManager() {
  const [employees, setEmployees] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<unknown>(null);
  
  // Modal de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingUpdate, setPendingUpdate] = useState<{ id: string; newSalary: string; oldSalary: number } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchEmployees();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();
      if (data) setCurrentUser(data);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, base_salary, minute_rate')
      .neq('role', 'gerente')
      .order('full_name');
    if (data) setEmployees(data);
    if (error) console.error('Error fetching employees:', error);
    setLoading(false);
  };

  const handleSalaryClick = (empId: string, currentSalary: number) => {
    setPendingUpdate({ id: empId, newSalary: currentSalary.toString(), oldSalary: currentSalary });
    setShowPasswordModal(true);
    setPasswordError('');
    setPassword('');
  };

  const updateSalary = async () => {
    if (!pendingUpdate) return;
    
    const newSalary = parseFloat(pendingUpdate.newSalary);
    if (isNaN(newSalary) || newSalary <= 0) {
      setPasswordError('Salario inválido');
      return;
    }

    if (!password) {
      setPasswordError('Ingresa tu contraseña');
      return;
    }

    if (!currentUser || currentUser.role !== 'gerente') {
      setPasswordError('Solo gerentes pueden actualizar salarios');
      return;
    }

    try {
      setUpdating(true);
      setPasswordError('');

      // Verify password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPasswordError('Sesión expirada. Inicia sesión de nuevo.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: password
      });

      if (signInError) {
        setPasswordError('Contraseña incorrecta');
        return;
      }

      // Update salary in profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ base_salary: newSalary })
        .eq('id', pendingUpdate.id);

      if (updateError) {
        setPasswordError('Error al actualizar: ' + updateError.message);
        return;
      }

      // Record in salary_audit
      const { error: auditError } = await supabase
        .from('salary_audit')
        .insert({
          employee_id: pendingUpdate.id,
          changed_by_id: currentUser.id,
          old_salary: pendingUpdate.oldSalary,
          new_salary: newSalary,
          change_reason: `Actualización manual por ${currentUser.full_name}`
        });

      if (auditError) {
        console.error('Error creating audit record:', auditError);
      }

      // Refresh employee list
      await fetchEmployees();
      setShowPasswordModal(false);
      setPassword('');
      setPendingUpdate(null);
    } catch (error: unknown) {
      setPasswordError('Error: ' + ((error as Error).message || 'Intenta de nuevo'));
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-600">Cargando datos financieros...</div>;

  if (!currentUser || currentUser.role !== 'gerente') {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Gestión de Salarios Base
        </h3>
        <p className="text-gray-600">Solo los gerentes pueden actualizar salarios.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Gestión de Salarios Base
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs">
              <tr>
                <th className="px-4 py-3">Empleado</th>
                <th className="px-4 py-3">Cargo</th>
                <th className="px-4 py-3">Salario Base (Mensual)</th>
                <th className="px-4 py-3">Valor Minuto (Auto)</th>
                <th className="px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{emp.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSalaryClick(emp.id, emp.base_salary)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-mono font-semibold transition"
                    >
                      $<span>{(emp.base_salary || 0).toLocaleString()}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-600">
                    ${emp.minute_rate?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => fetchEmployees()} className="text-gray-400 hover:text-green-600 transition">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600" />
                Confirmar Actualización de Salario
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPendingUpdate(null);
                }}
                disabled={updating}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {pendingUpdate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700 font-semibold mb-1">Cambio Pendiente:</p>
                <p className="text-sm text-gray-900 font-mono">
                  ${pendingUpdate.oldSalary?.toLocaleString()} → ${parseFloat(pendingUpdate.newSalary).toLocaleString()}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Tu Contraseña de Gerente</label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  disabled={updating}
                />
              </div>
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-semibold">{passwordError}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPendingUpdate(null);
                }}
                disabled={updating}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={updateSalary}
                disabled={updating || !password}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}