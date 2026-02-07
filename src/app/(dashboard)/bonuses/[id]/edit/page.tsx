"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

interface Employee {
  id: string;
  full_name: string;
  cargo?: string;
}

export default function BonusFormPage() {
  const router = useRouter();
  const params = useParams();
  const bonusId = params?.id;
  const { t, isClient } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Form state
  const [userId, setUserId] = useState('');
  const [bonusType, setBonusType] = useState<'manual' | 'performance' | 'attendance' | 'punctuality' | 'schedule_compliance'>('manual');
  const [amount, setAmount] = useState('0');
  const [percentage, setPercentage] = useState('0');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'active' | 'expired'>('active');
  const [message, setMessage] = useState('');

  // Performance metric rules
  const [attendanceThreshold, setAttendanceThreshold] = useState('95');
  const [punctualityThreshold, setPunctualityThreshold] = useState('98');
  const [scheduleThreshold, setScheduleThreshold] = useState('95');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load employees
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id, full_name, cargo')
        .eq('role', 'empleado')
        .order('full_name');

      setEmployees(employeesData || []);

      // Load bonus if editing
      if (bonusId) {
        const { data: bonusData } = await supabase
          .from('performance_bonuses')
          .select('*')
          .eq('id', bonusId)
          .single();

        if (bonusData) {
          setUserId(bonusData.user_id);
          setBonusType(bonusData.bonus_type);
          setAmount(bonusData.amount.toString());
          setPercentage(bonusData.percentage?.toString() || '0');
          setDescription(bonusData.description || '');
          setStartDate(bonusData.start_date);
          setEndDate(bonusData.end_date || '');
          setStatus(bonusData.status);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      setMessage(t('employee') + ' ' + t('required'));
      return;
    }

    if (parseFloat(amount) <= 0) {
      setMessage(t('amount') + ' ' + t('required'));
      return;
    }

    if (!startDate) {
      setMessage(t('startDate') + ' ' + t('required'));
      return;
    }

    try {
      setSaving(true);

      const bonusData = {
        user_id: userId,
        bonus_type: bonusType,
        amount: parseFloat(amount),
        percentage: percentage ? parseFloat(percentage) : null,
        description: description || null,
        start_date: startDate,
        end_date: endDate || null,
        status,
      };

      if (bonusId) {
        // Update existing bonus
        const { error } = await supabase
          .from('performance_bonuses')
          .update(bonusData)
          .eq('id', bonusId);

        if (error) throw error;
        setMessage(t('edit_bonus_success'));
      } else {
        // Create new bonus
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('performance_bonuses')
          .insert({
            ...bonusData,
            created_by: user.id,
          });

        if (error) throw error;
        setMessage(t('add_bonus_success'));
      }

      setTimeout(() => router.push('/bonuses'), 1500);
    } catch (err) {
      console.error('Error saving bonus:', err);
      setMessage(bonusId ? t('error_editing_bonus') : t('error_adding_bonus'));
    } finally {
      setSaving(false);
    }
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['gerente', 'supervisor']}>
      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/bonuses"
          className="flex items-center gap-2 text-[#FF8C00] hover:text-orange-600 mb-6 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {bonusId ? 'Editar Bono' : t('addBonus')}
        </h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('éxito') || message.includes('success')
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('employee')} *
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!!bonusId || saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none disabled:opacity-50"
            >
              <option value="">Selecciona un empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} - {emp.cargo || 'Sin cargo'}
                </option>
              ))}
            </select>
          </div>

          {/* Bonus Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('bonusType')} *
            </label>
            <select
              value={bonusType}
              onChange={(e) => setBonusType(e.target.value as any)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            >
              <option value="manual">{t('manualBonus')}</option>
              <option value="performance">{t('performanceBonus')}</option>
              <option value="attendance">{t('attendanceBonus')}</option>
              <option value="punctuality">{t('punctualityBonus')}</option>
              <option value="schedule_compliance">{t('scheduleBonus')}</option>
            </select>
          </div>

          {/* Information about automatic bonuses */}
          {bonusType !== 'manual' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    {bonusType === 'attendance' && 'Bono por Asistencia'}
                    {bonusType === 'punctuality' && 'Bono por Puntualidad'}
                    {bonusType === 'schedule_compliance' && 'Bono por Cumplimiento de Horario'}
                    {bonusType === 'performance' && 'Bono por Desempeño'}
                  </p>
                  <p className="text-xs text-blue-800">
                    Este bono se calculará automáticamente según las métricas del empleado durante el período seleccionado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Amount & Percentage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('amount')} ($) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('percentage')} (%)
              </label>
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
              rows={3}
              placeholder="Detalles adicionales del bono..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('startDate')} *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('endDate')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            >
              <option value="active">{t('active')}</option>
              <option value="expired">{t('expired')}</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/bonuses"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition text-center"
            >
              {t('cancel')}
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FF8C00] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
