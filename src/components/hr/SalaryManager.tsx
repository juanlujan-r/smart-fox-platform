"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, Save, RefreshCw } from 'lucide-react';

export default function SalaryManager() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, role, base_salary, minute_rate')
      .neq('role', 'gerente') // Opcional: No mostrarse a sí mismo si es gerente
      .order('full_name');
    if (data) setEmployees(data);
    setLoading(false);
  };

  const updateSalary = async (id: string, newSalary: string) => {
    const salary = parseFloat(newSalary);
    if (isNaN(salary)) return;

    const { error } = await supabase
      .from('profiles')
      .update({ base_salary: salary }) // El trigger calculará el minute_rate solo
      .eq('id', id);

    if (!error) {
      fetchEmployees(); // Recargar para ver el nuevo minute_rate calculado
    }
  };

  if (loading) return <div className="p-4 text-center">Cargando datos financieros...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Gestión de Salarios Base
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Salario Base (Mensual)</th>
              <th className="px-4 py-3">Valor Minuto (Auto)</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 font-medium">{emp.full_name}</td>
                <td className="px-4 py-3 capitalize text-gray-500">{emp.role}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input 
                      type="number" 
                      defaultValue={emp.base_salary}
                      onBlur={(e) => updateSalary(emp.id, e.target.value)}
                      className="w-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-right font-mono focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-gray-500">
                  ${emp.minute_rate?.toFixed(2) || '0.00'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => fetchEmployees()} className="text-gray-400 hover:text-green-600">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}