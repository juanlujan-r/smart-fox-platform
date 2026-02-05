"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Heart, 
  Shirt, 
  FileText, 
  Save, 
  Loader2, 
  AlertCircle,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Calendar
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface PersonalData {
  phone?: string;
  address?: string;
  city?: string;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relation?: string;
}

interface MedicalData {
  eps?: string;
  arl?: string;
  blood_type?: string;
  allergies?: string;
  pension?: string;
}

interface SizesData {
  shirt?: string;
  pants?: string;
  shoes?: string;
}

interface Profile {
  id: string;
  full_name?: string;
  document_id?: string;
  document_type?: string;
  hiring_date?: string;
  role?: string;
  personal_data?: PersonalData;
  medical_data?: MedicalData;
  sizes_data?: SizesData;
}

const DOCUMENT_TYPES = [
  'Cédula de Ciudadanía',
  'Pasaporte',
  'Cédula de Extranjería',
  'Documento de Identificación',
];

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const PANTS_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];


export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { pushToast } = useToast();

  const [profile, setProfile] = useState<Profile>({
    id: '',
    full_name: '',
    document_id: '',
    document_type: 'Cédula de Ciudadanía',
    hiring_date: '',
    role: '',
    personal_data: {
      phone: '',
      address: '',
      city: '',
      emergency_name: '',
      emergency_phone: '',
      emergency_relation: '',
    },
    medical_data: {
      eps: '',
      arl: '',
      blood_type: '',
      allergies: '',
      pension: '',
    },
    sizes_data: {
      shirt: 'M',
      pants: '32',
      shoes: '40',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          ...profile,
          ...data,
          personal_data: {
            ...profile.personal_data,
            ...(data.personal_data || {}),
          },
          medical_data: {
            ...profile.medical_data,
            ...(data.medical_data || {}),
          },
          sizes_data: {
            ...profile.sizes_data,
            ...(data.sizes_data || {}),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      pushToast('Error al cargar perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        pushToast('Usuario no autenticado', 'error');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          document_id: profile.document_id,
          document_type: profile.document_type,
          personal_data: profile.personal_data,
          medical_data: profile.medical_data,
          sizes_data: profile.sizes_data,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      pushToast('Perfil actualizado correctamente', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      pushToast('Error al guardar perfil: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalData = (field: keyof PersonalData, value: string) => {
    setProfile({
      ...profile,
      personal_data: {
        ...profile.personal_data,
        [field]: value,
      },
    });
  };

  const updateMedicalData = (field: keyof MedicalData, value: string) => {
    setProfile({
      ...profile,
      medical_data: {
        ...profile.medical_data,
        [field]: value,
      },
    });
  };

  const updateSizesData = (field: keyof SizesData, value: string) => {
    setProfile({
      ...profile,
      sizes_data: {
        ...profile.sizes_data,
        [field]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#FF8C00] mx-auto mb-3" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Gestiona tu información personal y profesional</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#FF8C00] hover:bg-[#e67d00] disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-[#FF8C00]/25 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="space-y-2 sticky top-6">
            {[
              { id: 'personal', label: 'Datos Personales', icon: User },
              { id: 'legal', label: 'Información Legal', icon: Briefcase },
              { id: 'medical', label: 'Información Médica', icon: Heart },
              { id: 'sizes', label: 'Tallas de Dotación', icon: Shirt },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#FF8C00] text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#FF8C00]'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
            {/* Personal Data Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Datos Personales</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Información de contacto y residencia</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Teléfono Móvil
                    </label>
                    <input
                      type="tel"
                      value={profile.personal_data?.phone || ''}
                      onChange={(e) => updatePersonalData('phone', e.target.value)}
                      placeholder="+57 300 1234567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Dirección de Residencia
                    </label>
                    <input
                      type="text"
                      value={profile.personal_data?.address || ''}
                      onChange={(e) => updatePersonalData('address', e.target.value)}
                      placeholder="Calle 10 # 40-50, Apto 301"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Ciudad
                    </label>
                    <input
                      type="text"
                      value={profile.personal_data?.city || ''}
                      onChange={(e) => updatePersonalData('city', e.target.value)}
                      placeholder="Medellín"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-6">
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Contacto de Emergencia
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={profile.personal_data?.emergency_name || ''}
                        onChange={(e) => updatePersonalData('emergency_name', e.target.value)}
                        placeholder="Nombre completo"
                        className="px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                      <input
                        type="tel"
                        value={profile.personal_data?.emergency_phone || ''}
                        onChange={(e) => updatePersonalData('emergency_phone', e.target.value)}
                        placeholder="Teléfono de contacto"
                        className="px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                      <input
                        type="text"
                        value={profile.personal_data?.emergency_relation || ''}
                        onChange={(e) => updatePersonalData('emergency_relation', e.target.value)}
                        placeholder="Relación (Familiar, Amigo, etc)"
                        className="px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-400 outline-none md:col-span-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legal Info Tab (Read Only) */}
            {activeTab === 'legal' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Briefcase className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Información Legal</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Datos de identificación y contrato (Solo lectura)</p>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    Esta información está vinculada a tu cuenta y solo puede ser modificada por el departamento de RRHH.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Documento de Identidad</label>
                    <input
                      type="text"
                      value={profile.document_id || 'No registrado'}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Documento</label>
                    <select
                      value={profile.document_type || 'Cédula de Ciudadanía'}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Fecha de Ingreso
                    </label>
                    <input
                      type="date"
                      value={profile.hiring_date || ''}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Cargo Actual</label>
                    <input
                      type="text"
                      value={profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'No asignado'}
                      disabled
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Medical Info Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Información Médica</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Datos de afiliaciones y condiciones médicas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">EPS (Salud)</label>
                    <input
                      type="text"
                      value={profile.medical_data?.eps || ''}
                      onChange={(e) => updateMedicalData('eps', e.target.value)}
                      placeholder="Nombre de la EPS"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Fondo de Pensiones</label>
                    <input
                      type="text"
                      value={profile.medical_data?.pension || ''}
                      onChange={(e) => updateMedicalData('pension', e.target.value)}
                      placeholder="Nombre del fondo de pensiones"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ARL (Riesgos Laborales)</label>
                    <input
                      type="text"
                      value={profile.medical_data?.arl || ''}
                      onChange={(e) => updateMedicalData('arl', e.target.value)}
                      placeholder="Nombre de la ARL"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo de Sangre</label>
                    <select
                      value={profile.medical_data?.blood_type || ''}
                      onChange={(e) => updateMedicalData('blood_type', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    >
                      <option value="">Seleccionar...</option>
                      {BLOOD_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Alergias / Condiciones Médicas</label>
                    <textarea
                      value={profile.medical_data?.allergies || ''}
                      onChange={(e) => updateMedicalData('allergies', e.target.value)}
                      placeholder="Describe cualquier alergia o condición médica importante"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Sizes Tab */}
            {activeTab === 'sizes' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <Shirt className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tallas de Dotación</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Información para solicitud de uniformes y equipos</p>
                  </div>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl p-4 mb-6">
                  <p className="text-sm text-cyan-900 dark:text-cyan-200">
                    Asegúrate de elegir las tallas correctas para que los uniformes se adapten bien.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Talla Camisa/Blusa</label>
                    <select
                      value={profile.sizes_data?.shirt || 'M'}
                      onChange={(e) => updateSizesData('shirt', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    >
                      {SHIRT_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Talla Pantalón</label>
                    <select
                      value={profile.sizes_data?.pants || '32'}
                      onChange={(e) => updateSizesData('pants', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    >
                      {PANTS_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Talla Calzado</label>
                    <select
                      value={profile.sizes_data?.shoes || '40'}
                      onChange={(e) => updateSizesData('shoes', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none transition"
                    >
                      {SHOE_SIZES.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}