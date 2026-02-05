'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FilePlus,
  ClipboardList,
  Paperclip,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import type { HrRequestRow, HrRequestType } from '@/types/database';

const REQUEST_TYPES: { value: HrRequestType; label: string }[] = [
  { value: 'permiso', label: 'Permiso' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'novedad', label: 'Novedad' },
  { value: 'vacaciones', label: 'Vacaciones' },
  { value: 'incapacidad', label: 'Incapacidad' },
];

const BUCKET = 'hr-attachments';
const ACCEPT_FILES = '.pdf,image/jpeg,image/png,image/gif,image/webp';

export default function ReportarSolicitarPage() {
  const { pushToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<HrRequestRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    type: 'permiso' as HrRequestType,
    details: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadingList(false);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from('hr_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRequests((data ?? []) as HrRequestRow[]);
      setLoadingList(false);
    };
    load();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setUploadedPath(null);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!userId || !file) return null;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    setUploading(false);
    if (error) {
      pushToast('Error al subir el archivo: ' + error.message, 'error');
      return null;
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);

    let attachmentPath: string | null = uploadedPath ?? null;
    if (file && !uploadedPath) {
      attachmentPath = await uploadFile();
      if (!attachmentPath) {
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from('hr_requests').insert([
      {
        user_id: userId,
        type: form.type,
        details: form.details || null,
        start_date: form.start_date,
        end_date: form.end_date,
        attachment_url: attachmentPath,
        status: 'pendiente',
      },
    ]);

    setSubmitting(false);
    if (error) {
      pushToast('Error al enviar la solicitud: ' + error.message, 'error');
      return;
    }
    pushToast('Solicitud enviada correctamente', 'success');
    setForm({ type: 'permiso', details: '', start_date: form.start_date, end_date: form.end_date });
    setFile(null);
    setUploadedPath(null);

    const { data } = await supabase
      .from('hr_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setRequests((data ?? []) as HrRequestRow[]);
  };

  const openAttachment = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) {
      pushToast('No se pudo abrir el adjunto: ' + error.message, 'error');
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const statusConfig = {
    pendiente: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' },
    aprobado: { label: 'Aprobado', className: 'bg-green-100 text-green-800' },
    rechazado: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
  } as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Reportar / Solicitar</h1>
        <p className="text-gray-500 mt-1">Permisos, licencias, novedades, vacaciones e incapacidades</p>
      </header>

      {/* Form Section */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-6">
          <FilePlus className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Nueva solicitud</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as HrRequestType }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
              required
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Detalles</label>
            <textarea
              value={form.details}
              onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition resize-none"
              placeholder="Describe tu solicitud..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Fecha inicio</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Fecha fin</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Adjunto (PDF o imágenes)</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#FF8C00]/50 text-gray-600 hover:text-[#FF8C00] cursor-pointer transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">
                  {uploading ? 'Subiendo…' : file ? file.name : 'Seleccionar archivo'}
                </span>
                <input
                  type="file"
                  accept={ACCEPT_FILES}
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={uploading}
                />
              </label>
              {file && !uploading && (
                <span className="text-xs text-gray-500">
                  Se subirá al enviar la solicitud
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex items-center gap-2 bg-[#FF8C00] text-white px-6 py-3 rounded-2xl font-bold shadow-md shadow-[#FF8C00]/25 hover:bg-[#e67d00] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FilePlus className="w-5 h-5" />
              )}
              {submitting ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </section>

      {/* Mis Solicitudes */}
      <section className="fox-card p-6">
        <div className="flex items-center gap-2 text-gray-800 mb-4">
          <ClipboardList className="w-5 h-5 text-[#FF8C00]" />
          <h2 className="text-lg font-bold">Mis Solicitudes</h2>
        </div>

        {loadingList ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF8C00]" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 py-8 text-center">Aún no tienes solicitudes.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => {
              const typeLabel = REQUEST_TYPES.find((t) => t.value === req.type)?.label ?? req.type;
              const status = statusConfig[req.status];
              return (
                <li
                  key={req.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{typeLabel}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(parseISO(req.start_date), 'd MMM', { locale: es })} –{' '}
                      {format(parseISO(req.end_date), 'd MMM yyyy', { locale: es })}
                    </p>
                    {req.details && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{req.details}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.className}`}
                    >
                      {status.label}
                    </span>
                    {req.attachment_url && (
                      <button
                        type="button"
                        onClick={() => openAttachment(req.attachment_url!)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:bg-white hover:border-[#FF8C00]/50 text-gray-600 hover:text-[#FF8C00] text-sm font-medium transition-colors"
                        title="Ver adjunto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver adjunto
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
