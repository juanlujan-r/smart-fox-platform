"use client";

import { useState } from 'react';
import { FileText, Download, Calculator, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx'; // Aseg?rate de tener: npm install xlsx
import { generatePayrollPreview, type PayrollPreviewRow } from '@/app/(dashboard)/hr-management/actions';

export default function PayrollGenerator() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preview, setPreview] = useState<PayrollPreviewRow[]>([]);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    if (!startDate || !endDate) return alert("Selecciona fechas");
    if (new Date(startDate) > new Date(endDate)) return alert("Fecha inicio mayor que fin");
    setLoading(true);

    try {
      const report = await generatePayrollPreview(startDate, endDate);
      setPreview(report || []);
    } catch (e: unknown) {
      console.error(e);
      alert("Error al generar n?mina: " + ((e as Error).message || "Intenta de nuevo"));
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
      "TOTAL A PAGAR": Number(p.total_pay.toFixed(2))
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "N?mina");
    XLSX.writeFile(wb, `Nomina_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-orange-600" />
        Generador de N?mina
      </h3>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Inicio</label>
          <input 
            type="date" 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Fin</label>
          <input 
            type="date" 
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
        <button 
          onClick={generatePreview}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Calcular
        </button>
      </div>

      {preview.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-900">Previsualizaci?n de Pago</h4>
            <button onClick={exportExcel} className="text-green-600 hover:bg-green-50 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 border border-green-200 transition">
              <Download className="w-4 h-4" /> Descargar Excel
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3 text-right">Minutos</th>
                  <th className="px-4 py-3 text-right">Valor Min</th>
                  <th className="px-4 py-3 text-right text-green-600">A PAGAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{row.minutes_worked}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">${(row.minute_rate ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-black font-mono text-green-600 text-lg">
                      ${row.total_pay.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
