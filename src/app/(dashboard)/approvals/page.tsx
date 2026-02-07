"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';
import RoleGuard from '@/components/RoleGuard';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  AlertCircle,
  FileText,
  ChevronDown,
  Download
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface Request {
  id: string;
  user_id: string;
  type: string;
  details: string;
  start_date: string;
  end_date: string;
  status: 'pendiente' | 'aprobado' | 'rechazado' | 'retirado';
  created_at: string;
  attachment_url?: string;
  profiles?: {
    full_name: string;
    document_id: string;
  };
}

const REQUEST_TYPES: { [key: string]: string } = {
  'permiso': 'Permiso Personal',
  'incapacidad': 'Incapacidad Médica',
  'vacaciones': 'Solicitud Vacaciones',
  'novedad': 'Reporte de Novedad',
};

const STATUS_CONFIG = {
  'pendiente': { label: 'Pending', color: 'yellow', icon: Clock },
  'aprobado': { label: 'Approved', color: 'green', icon: CheckCircle2 },
  'rechazado': { label: 'Rejected', color: 'red', icon: XCircle },
  'retirado': { label: 'Withdrawn', color: 'gray', icon: AlertCircle },
};

function ApprovalsPageContent() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<'pendiente' | 'aprobado' | 'rechazado' | 'retirado'>('pendiente');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const { pushToast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Verify user role
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profileData || !['supervisor', 'gerente'].includes(profileData.role)) {
        pushToast('No tienes permisos para acceder a esta página', 'error');
        setLoading(false);
        return;
      }

      await fetchRequests();
    };

    init();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current user profile
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Fetch all requests - Solo campos necesarios
      const { data: requestsData, error } = await supabase
        .from('hr_requests')
        .select('id, user_id, type, title, description, status, start_date, end_date, reason, created_at, updated_at, attachment_url')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch all profiles to get user names
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, document_id, role');

      // Create a map of profiles by id
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Filter and enrich requests
      let filteredRequests = (requestsData || []).map(req => ({
        ...req,
        profiles: {
          full_name: profilesMap.get(req.user_id)?.full_name || 'Sin nombre',
          document_id: profilesMap.get(req.user_id)?.document_id || 'N/A',
        }
      }));

      // If user is supervisor, filter out requests from other supervisors and managers
      if (currentProfile?.role === 'supervisor') {
        filteredRequests = filteredRequests.filter(req => {
          const reqUserRole = profilesMap.get(req.user_id)?.role;
          return reqUserRole === 'empleado';
        });
      }
      // If user is manager, they see all requests

      setRequests(filteredRequests);
    } catch (error: unknown) {
      console.error('Error fetching requests:', error);
      pushToast('Error al cargar solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('hr_requests')
        .update({ status: 'aprobado' })
        .eq('id', requestId);

      if (error) throw error;
      pushToast('Solicitud aprobada correctamente', 'success');
      await fetchRequests();
    } catch (error: unknown) {
      console.error('Error approving request:', error);
      pushToast('Error al aprobar solicitud', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason[requestId]) {
      pushToast('Debes ingresar una razón para rechazar', 'warning');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('hr_requests')
        .update({ status: 'rechazado', details: `${rejectionReason[requestId]}` })
        .eq('id', requestId);

      if (error) throw error;
      pushToast('Solicitud rechazada correctamente', 'success');
      setRejectionReason({ ...rejectionReason, [requestId]: '' });
      await fetchRequests();
    } catch (error: unknown) {
      console.error('Error rejecting request:', error);
      pushToast('Error al rechazar solicitud', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleWithdraw = async (requestId: string) => {
    setSending(true);
    try {
      const { error } = await supabase
        .from('hr_requests')
        .update({ status: 'retirado' })
        .eq('id', requestId);

      if (error) throw error;
      pushToast('Solicitud retirada correctamente', 'success');
      await fetchRequests();
    } catch (error: unknown) {
      console.error('Error withdrawing request:', error);
      pushToast('Error al retirar solicitud', 'error');
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = async (filePath: string, requestId: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('hr-attachments')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || `request-${requestId}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error('Error downloading file:', error);
      pushToast('Error al descargar archivo', 'error');
    }
  };

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pendiente') return r.status === 'pendiente';
    if (activeTab === 'aprobado') return r.status === 'aprobado';
    if (activeTab === 'rechazado') return r.status === 'rechazado';
    if (activeTab === 'retirado') return r.status === 'retirado';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900">{t('approvalOfRequests')}</h1>
        <p className="text-gray-600 mt-2">{t('manageAndAuthorize')}</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(['pendiente', 'aprobado', 'rechazado', 'retirado'] as const).map((status) => {
          const count = requests.filter(r => r.status === status).length;
          const statusInfo = STATUS_CONFIG[status];
          const colorMap = {
            yellow: 'bg-yellow-50 border-yellow-300 text-yellow-900',
            green: 'bg-green-50 border-green-300 text-green-900',
            red: 'bg-red-50 border-red-300 text-red-900',
            gray: 'bg-gray-50 border-gray-300 text-gray-900',
          };

          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`p-4 rounded-xl border-2 font-bold transition-all text-left ${
                activeTab === status
                  ? colorMap[statusInfo.color as keyof typeof colorMap]
                  : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
              }`}
            >
              <div className="text-2xl font-black">{count}</div>
              <div className="text-sm">{statusInfo.label}</div>
            </button>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No hay solicitudes {activeTab === 'pendiente' ? 'pendientes' : STATUS_CONFIG[activeTab].label.toLowerCase()}</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Collapsed State */}
              <button
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4 flex-1 text-left">
                  <div className="p-3 bg-orange-100 rounded-lg mt-1">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-gray-900">
                        {REQUEST_TYPES[request.type] || request.type}
                      </h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        request.status === 'pendiente' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'aprobado' ? 'bg-green-100 text-green-700' :
                        request.status === 'rechazado' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {STATUS_CONFIG[request.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.profiles?.full_name} • {new Date(request.created_at).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === request.id ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded State */}
              {expandedId === request.id && (
                <div className="border-t border-gray-100 p-6 bg-gray-50 space-y-6">
                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Solicitante</label>
                      <div>
                        <p className="font-bold text-gray-900">{request.profiles?.full_name}</p>
                        <p className="text-sm text-gray-600">{request.profiles?.document_id}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Período</label>
                      <p className="font-bold text-gray-900">
                        {request.start_date ? new Date(request.start_date).toLocaleDateString('es-CO') : '—'} a {request.end_date ? new Date(request.end_date).toLocaleDateString('es-CO') : '—'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Radicada</label>
                      <p className="font-bold text-gray-900">
                        {new Date(request.created_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Justificación</label>
                    <p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                      {request.details}
                    </p>
                  </div>

                  {/* Attachment */}
                  {request.attachment_url && (
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase mb-2 block">Documento Adjunto</label>
                      <button
                        onClick={() => downloadAttachment(request.attachment_url!, request.id)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition font-semibold text-sm text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                        Descargar documento
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {request.status === 'pendiente' && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApprove(request.id)}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Aprobar Solicitud
                      </button>

                      <div className="space-y-2">
                        <textarea
                          value={rejectionReason[request.id] || ''}
                          onChange={(e) => setRejectionReason({ ...rejectionReason, [request.id]: e.target.value })}
                          placeholder="Razón del rechazo (obligatorio)"
                          className="w-full px-4 py-2 rounded-lg border border-red-300 bg-white text-gray-900 placeholder-gray-500 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                          rows={2}
                        />
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={sending}
                          className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          Rechazar Solicitud
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Withdraw Button for Other States */}
                  {request.status !== 'pendiente' && request.status !== 'retirado' && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleWithdraw(request.id)}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition"
                      >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        Retirar Solicitud
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ApprovalsPage() {
  return (
    <RoleGuard allowedRoles={['supervisor', 'gerente']}>
      <ApprovalsPageContent />
    </RoleGuard>
  );
}
