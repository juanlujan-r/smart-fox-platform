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
  contract_type: string;
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
        .select('full_name, cargo, base_salary, role, supervisor_id, hiring_date, contract_type')
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
      const margin = 25;

      // Background border
      doc.setDrawColor(244, 124, 32); // Orange
      doc.setLineWidth(0.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      // Header background
      doc.setFillColor(244, 124, 32); // Orange
      doc.rect(0, 0, pageWidth, 35, 'F');

      // Company name in header
      doc.setTextColor(255, 255, 255); // White
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SMART FOX SOLUTIONS S.A.S', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('NIT: 900.123.456-7 | Bogotá D.C. - Colombia', pageWidth / 2, 22, { align: 'center' });
      doc.text('www.smartfoxsolutions.com | info@smartfoxsolutions.com', pageWidth / 2, 28, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Certificate title
      doc.setFontSize(18);
      doc.setTextColor(244, 124, 32); // Orange
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO LABORAL', pageWidth / 2, 50, { align: 'center' });
     
      // Certificate number
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      const certNumber = `No. ${Date.now().toString().slice(-8)}`;
      doc.text(certNumber, pageWidth / 2, 56, { align: 'center' });

      let yPosition = 68;
      const lineHeight = 7;
     
      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Certificate content
      const contractTypeRaw = String(profile.contract_type || '');
      const normalizedContract = contractTypeRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let contractLabel = 'Indefinido';
      if (normalizedContract.includes('obra') || normalizedContract.includes('labor')) contractLabel = 'Obra o Labor';
      else if (normalizedContract.includes('fijo')) contractLabel = 'Término Fijo';
      else if (normalizedContract.includes('indef')) contractLabel = 'Indefinido';
      else if (contractTypeRaw) contractLabel = contractTypeRaw;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const introText = 'La suscrita Gerencia de Recursos Humanos de SMART FOX SOLUTIONS S.A.S, certifica que:';
      doc.text(introText, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'justify' });
      yPosition += lineHeight * 2.5;
  // Employee name box
  doc.setFillColor(255, 248, 240); // Light orange
  doc.roundedRect(margin, yPosition - 5, pageWidth - margin * 2, 12, 2, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(244, 124, 32); // Orange
      doc.text(profile.full_name.toUpperCase(), pageWidth / 2, yPosition + 2, { align: 'center' });
      yPosition += lineHeight * 3;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

      doc.setFont('helvetica', 'normal');
     
       // Get document_id from profile
       const { data: docData } = await supabase
         .from('profiles')
         .select('document_id')
         .eq('id', user.id)
         .single();
     
       const docId = docData?.document_id || user.email?.split('@')[0] || 'N/A';
       doc.text(`Identificado(a) con Cédula de Ciudadanía No. ${docId}`, margin, yPosition);
       yPosition += lineHeight * 2.5;

      doc.text('Se encuentra vinculado(a) a nuestra organización desde:', margin, yPosition);
      yPosition += lineHeight * 1.8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(244, 124, 32); // Orange
      doc.text(`${new Date(profile.hiring_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 10, yPosition);
      yPosition += lineHeight * 2.5;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

      doc.setFont('helvetica', 'normal');
      doc.text('Desempeñándose actualmente en el cargo de:', margin, yPosition);
      yPosition += lineHeight * 1.8;
     
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(244, 124, 32); // Orange
      doc.text(`${profile.cargo || 'Agente'} - ${profile.role === 'gerente' ? 'Gerente de Cuenta' : profile.role === 'supervisor' ? 'Líder de Equipo' : 'Agente'}`, margin + 10, yPosition);
      yPosition += lineHeight * 2.5;
     
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo de contrato: ${contractLabel}`, margin, yPosition);
      yPosition += lineHeight * 1.8;

      doc.text('Con la siguiente información salarial:', margin, yPosition);
      yPosition += lineHeight * 2;

      // Data table
       // Table background
       doc.setFillColor(245, 245, 245);
       doc.roundedRect(margin + 5, yPosition - 2, pageWidth - margin * 2 - 10, 28, 2, 2, 'F');
     
       const data = [
         ['Salario Base Mensual:', `$${profile.base_salary.toLocaleString('es-CO')} COP`],
         ['Promedio Últimos 6 Meses:', `$${avgSalary.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP`],
         ['Supervisor Directo:', supervisor || 'No asignado'],
         ['Gerente de Área:', manager || 'No asignado'],
       ];

      data.forEach((row) => {
          doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(row[0], margin + 10, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(row[1], margin + 70, yPosition);
        yPosition += lineHeight * 1.5;
      });

      yPosition += lineHeight * 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const finalText = 'Esta certificación se expide a solicitud del interesado para los fines que estime conveniente, en la ciudad de Bogotá D.C.';
      doc.text(finalText, margin, yPosition, { maxWidth: pageWidth - margin * 2, align: 'justify' });
      yPosition += lineHeight * 3;

      // Date
      const today = new Date();
      const dateStr = today.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Fecha de expedición: ${dateStr}`, margin, pageHeight - margin - 30);

      // Signature placeholder
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth / 2 - 30, pageHeight - margin - 8, pageWidth / 2 + 30, pageHeight - margin - 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Gerencia de Recursos Humanos', pageWidth / 2, pageHeight - margin - 3, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text('SMART FOX SOLUTIONS S.A.S', pageWidth / 2, pageHeight - margin + 2, { align: 'center' });
     
      // Footer note
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text('Este documento es válido sin firma autógrafa según lo establecido en el decreto 2150 de 1995', pageWidth / 2, pageHeight - 8, { align: 'center' });

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
