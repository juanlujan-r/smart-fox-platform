"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, DollarSign, TrendingUp, Users, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfileInfo {
  full_name: string;
  cargo: string;
  base_salary: number;
  role: string;
  supervisor_id: string;
  hiring_date: string;
}

export default function MyInfoPage() {
  const { t, isClient } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [avgSalary, setAvgSalary] = useState(0);
  const [supervisor, setSupervisor] = useState<string>('');
  const [manager, setManager] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadProfileInfo();
  }, []);

  const loadProfileInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, cargo, base_salary, role, supervisor_id, hiring_date')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Load supervisor
        if (profileData.supervisor_id) {
          const { data: supervisorData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', profileData.supervisor_id)
            .single();
          if (supervisorData) setSupervisor(supervisorData.full_name);
        }

        // Load manager (first gerente in system)
        const { data: managerData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('role', 'gerente')
          .limit(1)
          .single();
        if (managerData) setManager(managerData.full_name);
      }

      // Calculate average salary (last 6 months with bonuses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: salaryData } = await supabase
        .from('salary_audit')
        .select('new_salary')
        .eq('employee_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString())
        .order('created_at', { ascending: false });

      if (salaryData && salaryData.length > 0) {
        const avg = salaryData.reduce((sum, s) => sum + (s.new_salary || 0), 0) / salaryData.length;
        setAvgSalary(avg);
      } else if (profileData) {
        setAvgSalary(profileData.base_salary);
      }
    } catch (err) {
      console.error('Error loading profile info:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      // Create PDF with certificate
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // Company header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SmartFox ERP Solutions', pageWidth / 2, margin + 10, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema de Gestión Empresarial', pageWidth / 2, margin + 16, { align: 'center' });

      // Add line separator
      doc.setDrawColor(244, 120, 32);
      doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

      // Certificate title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO LABORAL', pageWidth / 2, margin + 35, { align: 'center' });

      let yPosition = margin + 50;
      const lineHeight = 8;

      // Certificate content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      doc.text('Por medio de la presente, se certifica que:', margin, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFont('helvetica', 'bold');
      doc.text(profile.full_name.toUpperCase(), margin, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFont('helvetica', 'normal');
      doc.text(`Identificado con cédula de ciudadanía ${user.email?.split('@')[0] || 'N/A'}`, margin, yPosition);
      yPosition += lineHeight * 2;

      doc.text('Ha sido empleado de SmartFox ERP Solutions en calidad de:', margin, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFont('helvetica', 'bold');
      doc.text(`${profile.cargo || 'Sin asignar'} (${profile.role})`, margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFont('helvetica', 'normal');
      doc.text('Con los siguientes datos laborales:', margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Data table
      const data = [
        ['Fecha de Contratación:', new Date(profile.hiring_date).toLocaleDateString('es-CO')],
        ['Salario Actual:', `$${profile.base_salary.toLocaleString('es-CO')}`],
        ['Promedio Últimos 6 Meses:', `$${avgSalary.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`],
        ['Jefe Directo:', supervisor || 'Sin asignar'],
        ['Gerente Asignado:', manager || 'Sin asignar'],
      ];

      data.forEach((row) => {
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], margin + 60, yPosition);
        yPosition += lineHeight * 1.3;
      });

      yPosition += lineHeight;

      doc.text('Esta certificación se expide a solicitud del interesado para los fines que estime conveniente.', margin, yPosition, { maxWidth: pageWidth - margin * 2 });
      yPosition += lineHeight * 2;

      // Date
      const today = new Date();
      const dateStr = today.toLocaleDateString('es-CO');
      doc.setFont('helvetica', 'italic');
      doc.text(`Expedido en: ${dateStr}`, margin, pageHeight - margin - 20);

      // Signature placeholder
      doc.text('_____________________', margin + 40, pageHeight - margin - 5);
      doc.setFontSize(9);
      doc.text('Firma Autorizada', margin + 40, pageHeight - margin + 2, { align: 'center' });

      // Save PDF
      doc.save(`Certificado_Laboral_${profile.full_name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Error al generar el certificado');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t('couldNotLoad')}
      </div>
    );
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('myInformation')}</h1>

      {/* Información General */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-[#FF8C00]" />
          {t('generalInfo')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t('fullName')}</p>
            <p className="text-lg font-semibold text-gray-900">{profile.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('currentPosition')}</p>
            <p className="text-lg font-semibold text-gray-900">{profile.cargo || t('noAssigned')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('role')}</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">{profile.role}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('hireDate')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {profile.hiring_date ? new Date(profile.hiring_date).toLocaleDateString('es-CO') : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Información Salarial */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          {t('salaryInfo')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">{t('currentSalary')}</p>
            <p className="text-2xl font-bold text-gray-900">
              ${profile.base_salary.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('copMonth')}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {t('averageSalary')}
            </p>
            <p className="text-2xl font-bold text-green-700">
              ${avgSalary.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t('withBonuses')}</p>
          </div>
        </div>
      </div>

      {/* Estructura Organizacional */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          {t('organizationalStructure')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">{t('directBoss')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {supervisor || t('noAssigned')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('assignedManager')}</p>
            <p className="text-lg font-semibold text-gray-900">
              {manager || t('noAssigned')}
            </p>
          </div>
        </div>
      </div>

      {/* Certificado Laboral */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF8C00]" />
              {t('laborCertificate')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('generateCertificate')}
            </p>
          </div>
          <button
            onClick={generateCertificate}
            disabled={generating}
            className="flex items-center gap-2 bg-[#FF8C00] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {generating ? t('generating') : t('generate')}
          </button>
        </div>
      </div>
    </div>
  );
}
