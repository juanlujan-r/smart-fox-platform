"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Calculator, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx'; // Asegúrate de tener: npm install xlsx

export default function PayrollGenerator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    if (!startDate || !endDate) return alert("Selecciona fechas");
    setLoading(true);

    try {
      // 1. Obtener empleados y sus tarifas
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, role, base_salary, minute_rate');

      // 2. Obtener logs de asistencia en el rango
      const { data: logs } = await supabase
        .from('attendance_logs')
        .select('*')
        .gte('created_at', new Date(startDate).toISOString())
        .lte('created_at', new Date(endDate + 'T23:59:59').toISOString())
        .order('created_at');

      // 3. Calcular tiempo trabajado por empleado
      const report = profiles?.map(emp => {
        const empLogs = logs?.filter(l => l.user_id === emp.id) || [];
        let totalMinutes = 0;

        // Lógica simple de cálculo de tiempos (entrada -> salida/siguiente estado)
        empLogs.forEach((log, index) => {
          if (['entrada', 'reunion'].includes(log.state)) {
            const start = new Date(log.created_at).getTime();
            // Buscar siguiente log o usar hora actual si es hoy
            const nextLog = empLogs[index + 1];
            const end = nextLog ? new Date(nextLog.created_at).getTime() : start; // Simplificado para preview
            
            if (nextLog) {
                totalMinutes += (end - start) / (1000 * 60);
            }
          }
        });

        return {
          id: emp.id,
          name: emp.full_name,
          role: emp.role,
          salary: emp.base_salary,
          minute_rate: emp.minute_rate,
          minutes_worked: Math.floor(totalMinutes),
          total_pay: Math.floor(totalMinutes * (emp.minute_rate || 0))
        };
      }).filter(r => r.total_pay > 0); // Solo mostrar si trabajaron

      setPreview(report || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(preview.map(p => ({
      Empleado: p.name,
      Cargo: p.role,
      "Salario Base": p.salary,
      "Valor Minuto": p.minute_rate,
      "Minutos Trabajados": p.minutes_worked,
      "Horas Aprox": (p.minutes_worked / 60).toFixed(1),
      "TOTAL A PAGAR": p.total_pay
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nómina");
    XLSX.writeFile(wb, `Nomina_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mt-6">
      <h3 className="text-lg font-black text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-orange-600" />
        Generador de Nómina
      </h3>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Inicio</label>
          <input type="date" className="block w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" 
            onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Fin</label>
          <input type="date" className="block w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700" 
            onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button 
          onClick={generatePreview}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Calcular
        </button>
      </div>

      {preview.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-700 dark:text-gray-200">Previsualización de Pago</h4>
            <button onClick={exportExcel} className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 border border-green-200">
              <Download className="w-4 h-4" /> Descargar Excel
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3 text-right">Minutos</th>
                  <th className="px-4 py-3 text-right">Valor Min</th>
                  <th className="px-4 py-3 text-right text-green-600">A PAGAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {preview.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">{row.minutes_worked}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-500">${row.minute_rate?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black font-mono text-green-600 text-lg">
                      ${row.total_pay.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}