'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import {
  User,
  Briefcase,
  GraduationCap,
  Heart,
  Phone,
  Shirt,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  PersonalData,
  AcademicData,
  ExperienceEntry,
  EducationEntry,
  MedicalData,
  EmergencyContact,
  SizesData,
} from '@/types/database';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PANTS_SIZES = ['28', '30', '32', '34', '36', '38', '40'];
const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'];
const GLOVE_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

const defaultPersonal: PersonalData = { fullName: '', ssn: '', dependents: 0, socialSecurity: '' };
const defaultAcademic: AcademicData = { experience: [], education: [] };
const defaultMedical: MedicalData = {
  bloodType: '',
  allergies: '',
  medicalConditions: [],
  eps: '',
  arl: '',
  emergencyContact: { name: '', phone: '', relation: '' },
};
const defaultSizes: SizesData = { shirt: '', pants: '', shoes: '', gloves: '' };

export default function ProfilePage() {
  const { pushToast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'medical' | 'sizes'>('personal');

  const [personal, setPersonal] = useState<PersonalData>(defaultPersonal);
  const [academic, setAcademic] = useState<AcademicData>(defaultAcademic);
  const [medical, setMedical] = useState<MedicalData>(defaultMedical);
  const [sizes, setSizes] = useState<SizesData>(defaultSizes);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('personal_data, medical_data, academic_data, sizes_data')
        .eq('id', user.id)
        .single();
      if (data) {
        if (data.personal_data && typeof data.personal_data === 'object')
          setPersonal({ ...defaultPersonal, ...data.personal_data } as PersonalData);
        if (data.medical_data && typeof data.medical_data === 'object')
          setMedical({
            ...defaultMedical,
            ...data.medical_data,
            emergencyContact: { ...defaultMedical.emergencyContact!, ...(data.medical_data as MedicalData).emergencyContact },
          } as MedicalData);
        if (data.academic_data && typeof data.academic_data === 'object')
          setAcademic({
            experience: (data.academic_data as AcademicData).experience ?? [],
            education: (data.academic_data as AcademicData).education ?? [],
          });
        if (data.sizes_data && typeof data.sizes_data === 'object')
          setSizes({ ...defaultSizes, ...data.sizes_data } as SizesData);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        personal_data: personal,
        medical_data: medical,
        academic_data: academic,
        sizes_data: sizes,
      })
      .eq('id', userId);
    setSaving(false);
    if (error) {
      pushToast('Error al guardar: ' + error.message, 'error');
      return;
    }
    pushToast('Información guardada correctamente', 'success');
  };

  const addExperience = () =>
    setAcademic((a) => ({
      ...a,
      experience: [...a.experience, { company: '', role: '', startDate: '', endDate: '' }],
    }));
  const removeExperience = (i: number) =>
    setAcademic((a) => ({ ...a, experience: a.experience.filter((_, idx) => idx !== i) }));
  const updateExperience = (i: number, field: keyof ExperienceEntry, value: string) =>
    setAcademic((a) => ({
      ...a,
      experience: a.experience.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    }));

  const addEducation = () =>
    setAcademic((a) => ({
      ...a,
      education: [...a.education, { degree: '', institution: '', date: '' }],
    }));
  const removeEducation = (i: number) =>
    setAcademic((a) => ({ ...a, education: a.education.filter((_, idx) => idx !== i) }));
  const updateEducation = (i: number, field: keyof EducationEntry, value: string) =>
    setAcademic((a) => ({
      ...a,
      education: a.education.map((e, idx) => (idx === i ? { ...e, [field]: value } : e)),
    }));

  const setMedicalCondition = (value: string) =>
    setMedical((m) => ({
      ...m,
      medicalConditions: value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }));

  const tabs = [
    { id: 'personal' as const, label: 'Personal', icon: User },
    { id: 'academic' as const, label: 'Laboral y Académico', icon: Briefcase },
    { id: 'medical' as const, label: 'Médico y Emergencias', icon: Heart },
    { id: 'sizes' as const, label: 'Dotación', icon: Shirt },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Mi Información</h1>
        <p className="text-gray-500 mt-1">Gestiona tu perfil en Smart Fox ERP</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.06)] border border-gray-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === id
                ? 'bg-[#FF8C00] text-white shadow-md shadow-[#FF8C00]/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-8">
        {/* Personal */}
        {activeTab === 'personal' && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <User className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Datos personales</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Nombre completo</span>
                <input
                  type="text"
                  value={personal.fullName ?? ''}
                  onChange={(e) => setPersonal((p) => ({ ...p, fullName: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                  placeholder="Ej. Juan Pérez"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Cédula (SSN)</span>
                <input
                  type="text"
                  value={personal.ssn ?? ''}
                  onChange={(e) => setPersonal((p) => ({ ...p, ssn: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                  placeholder="Ej. 123456789"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">N° de dependientes</span>
                <input
                  type="number"
                  min={0}
                  value={personal.dependents ?? 0}
                  onChange={(e) => setPersonal((p) => ({ ...p, dependents: parseInt(e.target.value, 10) || 0 }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Seguridad social</span>
                <input
                  type="text"
                  value={personal.socialSecurity ?? ''}
                  onChange={(e) => setPersonal((p) => ({ ...p, socialSecurity: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                  placeholder="Número de afiliación"
                />
              </label>
            </div>
          </div>
        )}

        {/* Laboral y Académico */}
        {activeTab === 'academic' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Experiencia laboral</h2>
            </div>
            <div className="space-y-4">
              {academic.experience.map((exp, i) => (
                <div key={i} className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-[#FF8C00] uppercase tracking-wide">Experiencia {i + 1}</span>
                    <button type="button" onClick={() => removeExperience(i)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Empresa"
                      value={exp.company}
                      onChange={(e) => updateExperience(i, 'company', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                    />
                    <input
                      placeholder="Cargo / Rol"
                      value={exp.role}
                      onChange={(e) => updateExperience(i, 'role', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                    />
                    <input
                      placeholder="Fecha inicio (ej. 2020-01)"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(i, 'startDate', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                    />
                    <input
                      placeholder="Fecha fin (ej. 2023-12)"
                      value={exp.endDate}
                      onChange={(e) => updateExperience(i, 'endDate', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addExperience}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#FF8C00] hover:text-[#FF8C00] font-medium text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar experiencia
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <GraduationCap className="w-5 h-5 text-[#FF8C00]" />
                <h2 className="text-lg font-bold">Formación académica</h2>
              </div>
              <div className="space-y-4">
                {academic.education.map((edu, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-[#FF8C00] uppercase tracking-wide">Formación {i + 1}</span>
                      <button type="button" onClick={() => removeEducation(i)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        placeholder="Título / Grado"
                        value={edu.degree}
                        onChange={(e) => updateEducation(i, 'degree', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                      />
                      <input
                        placeholder="Institución"
                        value={edu.institution}
                        onChange={(e) => updateEducation(i, 'institution', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm"
                      />
                      <input
                        placeholder="Fecha (ej. 2019)"
                        value={edu.date}
                        onChange={(e) => updateEducation(i, 'date', e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none text-sm md:col-span-2"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-600 hover:border-[#FF8C00] hover:text-[#FF8C00] font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar formación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Médico y Emergencias */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Heart className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Médico y emergencias</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Tipo de sangre</span>
                <select
                  value={medical.bloodType ?? ''}
                  onChange={(e) => setMedical((m) => ({ ...m, bloodType: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                >
                  <option value="">Seleccionar</option>
                  {BLOOD_TYPES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-1">
                <span className="text-sm font-medium text-gray-600">Alergias</span>
                <input
                  type="text"
                  value={medical.allergies ?? ''}
                  onChange={(e) => setMedical((m) => ({ ...m, allergies: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none transition"
                  placeholder="Ej. Penicilina, polen"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Condiciones médicas (Diabetes, hipertensión, etc.)</span>
                <input
                  type="text"
                  value={(medical.medicalConditions ?? []).join(', ')}
                  onChange={(e) => setMedicalCondition(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none transition"
                  placeholder="Separadas por coma"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">EPS</span>
                <input
                  type="text"
                  value={medical.eps ?? ''}
                  onChange={(e) => setMedical((m) => ({ ...m, eps: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none transition"
                  placeholder="Entidad promotora de salud"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">ARL</span>
                <input
                  type="text"
                  value={medical.arl ?? ''}
                  onChange={(e) => setMedical((m) => ({ ...m, arl: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none transition"
                  placeholder="Administradora de riesgos laborales"
                />
              </label>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-gray-700 mb-3">
                <Phone className="w-5 h-5 text-[#FF8C00]" />
                <span className="font-bold">Contacto de emergencia</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100">
                <input
                  placeholder="Nombre"
                  value={medical.emergencyContact?.name ?? ''}
                  onChange={(e) => setMedical((m) => ({
                    ...m,
                    emergencyContact: { ...m.emergencyContact!, name: e.target.value },
                  }))}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
                <input
                  placeholder="Teléfono"
                  value={medical.emergencyContact?.phone ?? ''}
                  onChange={(e) => setMedical((m) => ({
                    ...m,
                    emergencyContact: { ...m.emergencyContact!, phone: e.target.value },
                  }))}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
                <input
                  placeholder="Parentesco / Relación"
                  value={medical.emergencyContact?.relation ?? ''}
                  onChange={(e) => setMedical((m) => ({
                    ...m,
                    emergencyContact: { ...m.emergencyContact!, relation: e.target.value },
                  }))}
                  className="px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dotación */}
        {activeTab === 'sizes' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <Shirt className="w-5 h-5 text-[#FF8C00]" />
              <h2 className="text-lg font-bold">Tallas de dotación</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Camisa</span>
                <select
                  value={sizes.shirt ?? ''}
                  onChange={(e) => setSizes((s) => ({ ...s, shirt: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                >
                  <option value="">Seleccionar</option>
                  {SHIRT_SIZES.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Pantalón</span>
                <select
                  value={sizes.pants ?? ''}
                  onChange={(e) => setSizes((s) => ({ ...s, pants: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                >
                  <option value="">Seleccionar</option>
                  {PANTS_SIZES.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Calzado</span>
                <select
                  value={sizes.shoes ?? ''}
                  onChange={(e) => setSizes((s) => ({ ...s, shoes: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                >
                  <option value="">Seleccionar</option>
                  {SHOE_SIZES.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-600">Guantes</span>
                <select
                  value={sizes.gloves ?? ''}
                  onChange={(e) => setSizes((s) => ({ ...s, gloves: e.target.value }))}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF8C00]/40 focus:border-[#FF8C00] outline-none transition"
                >
                  <option value="">Seleccionar</option>
                  {GLOVE_SIZES.map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#FF8C00] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-[#FF8C00]/25 hover:shadow-xl hover:shadow-[#FF8C00]/30 hover:bg-[#e67d00] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Guardando…' : 'Guardar Información'}
        </button>
      </div>
    </div>
  );
}
