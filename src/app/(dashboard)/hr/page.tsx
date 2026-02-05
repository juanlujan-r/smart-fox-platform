"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, UserPlus, Phone, Briefcase } from 'lucide-react';
import ShiftControl from '@/components/hr/ShiftControl';

export default function RRHHPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (data) setEmployees(data);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const addEmployee = async () => {
    const name = prompt("Nombre completo del empleado:");
    const role = prompt("Cargo (Ej: Gerente, Mesero, Chef):");
    const salary = prompt("Salario mensual:");

    if (name && role && salary) {
      const { error } = await supabase.from('employees').insert([
        { full_name: name, role: role, salary: parseFloat(salary), status: 'active' }
      ]);
      if (error) alert("Error al guardar: " + error.message);
      else fetchEmployees();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900">Gestión de Talento</h1>
          <p className="text-gray-600 mt-2">Control de nómina y equipo Smart Fox.</p>
        </div>
        <button 
          onClick={addEmployee}
          className="bg-[#FF8C00] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
        >
          <UserPlus className="w-5 h-5" /> Registrar Empleado
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          <ShiftControl />
        </div>
        {loading ? <p>Cargando equipo...</p> : employees.map((emp) => (
          <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="bg-gray-100 p-3 rounded-full text-gray-400">
                <Users className="w-6 h-6" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                emp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {emp.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{emp.full_name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> {emp.role}
              </p>
            </div>
            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3" /> {emp.phone || 'Sin tel.'}
              </span>
              <span className="font-black text-gray-700">${emp.salary.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
