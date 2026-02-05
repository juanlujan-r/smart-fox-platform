"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Paperclip, Loader2, FileText, CheckCircle } from 'lucide-react';

const REQUEST_TYPES = [
  { id: 'permiso', label: 'Permiso Personal' },
  { id: 'incapacidad', label: 'Incapacidad Médica' },
  { id: 'vacaciones', label: 'Solicitud Vacaciones' },
  { id: 'novedad', label: 'Reporte de Novedad' },
];

export default function RequestsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [type, setType] = useState('permiso');
  const [details, setDetails] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No usuario autenticado");

      let fileUrl = null;

      // SUBIDA DE ARCHIVO BLINDADA
      if (file) {
        // Limpiar nombre de archivo (solo letras, numeros y puntos)
        const fileExt = file.name.split('.').pop();
        const cleanName = `${Date.now()}_document.${fileExt}`;
        const filePath = `${user.id}/${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('hr-attachments') // <--- NOMBRE EXACTO DEL BUCKET
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('hr-attachments')
          .getPublicUrl(filePath);
          
        fileUrl = publicData.publicUrl;
      }

      // INSERTAR EN BASE DE DATOS
      const { error: dbError } = await supabase
        .from('hr_requests')
        .insert([{
          user_id: user.id,
          type,
          details,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
          attachment_url: fileUrl,
          status: 'pendiente'
        }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setDetails('');
      setFile(null);
    } catch (error: any) {
      console.error("Error enviando solicitud:", error);
      alert(`Error: ${error.message || "No se pudo enviar la solicitud"}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white dark:bg-gray-800 rounded-2xl text-center shadow-lg border border-green-100">
        <div className="bg-green-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">¡Solicitud Enviada!</h2>
        <p className="text-gray-500 mb-8">Tu solicitud ha sido radicada y notificada a tu supervisor.</p>
        <button onClick={() => setSuccess(false)} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold">
          Nueva Solicitud
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-800 dark:text-white mb-6">Radicar Solicitud o Novedad</h1>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        
        {/* TIPO */}
        <div className="grid grid-cols-2 gap-3">
          {REQUEST_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={`p-4 rounded-xl text-sm font-bold border-2 transition-all text-left ${
                type === t.id 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* FECHAS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Desde</label>
            <input required type="date" className="w-full bg-gray-50 p-3 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hasta</label>
            <input required type="date" className="w-full bg-gray-50 p-3 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* DETALLE */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Justificación / Detalle</label>
          <textarea required rows={4} className="w-full bg-gray-50 p-3 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all resize-none"
            placeholder="Describe brevemente el motivo..."
            onChange={(e) => setDetails(e.target.value)}
          ></textarea>
        </div>

        {/* ARCHIVO */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Adjunto (Opcional)</label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <div className="flex flex-col items-center gap-2 text-gray-400">
              {file ? (
                <>
                  <FileText className="w-8 h-8 text-orange-500" />
                  <span className="text-sm font-bold text-gray-700">{file.name}</span>
                </>
              ) : (
                <>
                  <Paperclip className="w-6 h-6" />
                  <span className="text-xs">Clic para adjuntar soporte (PDF, JPG)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          Radicar Solicitud
        </button>

      </form>
    </div>
  );
}