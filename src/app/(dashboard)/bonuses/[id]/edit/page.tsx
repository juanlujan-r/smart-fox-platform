"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, ArrowLeft, DollarSign, Percent } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

interface Employee {
  id: string;
  full_name: string;
  cargo?: string;
  base_salary: number;
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
  const [bonusType, setBonusType] = useState<'manual' | 'performance'>('manual');
  const [calculationType, setCalculationType] = useState<'fixed' | 'percentage'>('fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [percentageValue, setPercentageValue] = useState('');
  const [description, setDescription] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Set default payment date to next month's 30th
    if (!paymentDate) {
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 30);
      setPaymentDate(nextMonth.toISOString().split('T')[0]);
    }
  }, []);

  const loadData = async () => {
    try {
      // Load employees with salary info
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id, full_name, cargo, base_salary')
        .order('full_name');

      setEmployees(employeesData || []);

      // Load bonus if editing
      if (bonusId && bonusId !== 'new') {
        const { data: bonusData } = await supabase
          .from('performance_bonuses')
          .select('*')
          .eq('id', bonusId)
          .single();

        if (bonusData) {
          setUserId(bonusData.user_id);
          setBonusType(bonusData.bonus_type || 'manual');
          setDescription(bonusData.description || '');
          setPaymentDate(bonusData.payment_date || bonusData.start_date);
          
          if (bonusData.percentage && bonusData.percentage > 0) {
            setCalculationType('percentage');
            setPercentageValue(bonusData.percentage.toString());
          } else {
            setCalculationType('fixed');
            setFixedAmount(bonusData.amount.toString());
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setMessage('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === userId);
  };

  const calculateBonusAmount = () => {
    const employee = getSelectedEmployee();
    if (!employee) return 0;

    if (calculationType === 'fixed') {
      return parseFloat(fixedAmount) || 0;
    } else {
      const percentage = parseFloat(percentageValue) || 0;
      return (employee.base_salary * percentage) / 100;
    }
  };

  const handleSave = async () => {
    if (!userId) {
      setMessage('Debes seleccionar un empleado');
      return;
    }

    if (!paymentDate) {
      setMessage('Debes establecer una fecha de pago');
      return;
    }

    const finalAmount = calculateBonusAmount();
    if (finalAmount <= 0) {
      setMessage('El monto del bono debe ser mayor a cero');
      return;
    }

    try {
      setSaving(true);

      const bonusData = {
        user_id: userId,
        bonus_type: bonusType,
        amount: finalAmount,
        percentage: calculationType === 'percentage' ? parseFloat(percentageValue) : null,
        description: description || null,
        payment_date: paymentDate,
        status: 'pending',
        // Keep old fields for compatibility
        start_date: paymentDate,
        end_date: null,
      };

      if (bonusId && bonusId !== 'new') {
        // Update existing bonus
        const { error } = await supabase
          .from('performance_bonuses')
          .update(bonusData)
          .eq('id', bonusId);

        if (error) throw error;
        setMessage('Bono actualizado exitosamente');
      } else {
        // Create new bonus
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { error } = await supabase
          .from('performance_bonuses')
          .insert({
            ...bonusData,
            created_by: user.id,
          });

        if (error) throw error;
        setMessage('Bono agregado exitosamente');
      }

      setTimeout(() => router.push('/bonuses'), 1500);
    } catch (err) {
      console.error('Error saving bonus:', err);
      setMessage('Error al guardar el bono');
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

  const selectedEmployee = getSelectedEmployee();
  const estimatedAmount = calculateBonusAmount();

  return (
    <RoleGuard allowedRoles={['gerente', 'supervisor']}>
      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/bonuses"
          className="flex items-center gap-2 text-[#FF8C00] hover:text-orange-600 mb-6 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {bonusId && bonusId !== 'new' ? 'Editar Bono' : 'Agregar Bono'}
        </h1>
        <p className="text-gray-600 mb-6">
          Los bonos se pagarán en la próxima fecha de nómina
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('exitosamente') || message.includes('éxito') || message.includes('success')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Empleado *
            </label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!!(bonusId && bonusId !== 'new') || saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">Selecciona un empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name} {emp.cargo ? `- ${emp.cargo}` : ''} (Salario: ${emp.base_salary?.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Bonus Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tipo de Bono *
            </label>
            <select
              value={bonusType}
              onChange={(e) => setBonusType(e.target.value as any)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            >
              <option value="manual">Bono Manual</option>
              <option value="performance">Bono por Desempeño</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {bonusType === 'manual' && 'Bono discrecional asignado manualmente'}
              {bonusType === 'performance' && 'Bono basado en métricas de desempeño del empleado'}
            </p>
          </div>

          {/* Calculation Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Método de Cálculo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCalculationType('fixed')}
                disabled={saving}
                className={`p-4 rounded-lg border-2 transition ${
                  calculationType === 'fixed'
                    ? 'border-[#FF8C00] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <DollarSign className={`w-6 h-6 mx-auto mb-2 ${
                  calculationType === 'fixed' ? 'text-[#FF8C00]' : 'text-gray-400'
                }`} />
                <p className="font-semibold text-sm">Monto Fijo</p>
                <p className="text-xs text-gray-500 mt-1">Valor específico en COP</p>
              </button>
              <button
                type="button"
                onClick={() => setCalculationType('percentage')}
                disabled={saving}
                className={`p-4 rounded-lg border-2 transition ${
                  calculationType === 'percentage'
                    ? 'border-[#FF8C00] bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Percent className={`w-6 h-6 mx-auto mb-2 ${
                  calculationType === 'percentage' ? 'text-[#FF8C00]' : 'text-gray-400'
                }`} />
                <p className="font-semibold text-sm">Porcentaje</p>
                <p className="text-xs text-gray-500 mt-1">% del salario base</p>
              </button>
            </div>
          </div>

          {/* Amount Input (conditional) */}
          {calculationType === 'fixed' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto del Bono (COP) *
              </label>
              <input
                type="number"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                placeholder="Ej: 500000"
                min="0"
                step="10000"
              />
            </div>
          )}

          {/* Percentage Input (conditional) */}
          {calculationType === 'percentage' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Porcentaje del Salario Base (%) *
              </label>
              <input
                type="number"
                value={percentageValue}
                onChange={(e) => setPercentageValue(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
                placeholder="Ej: 10"
                min="0"
                max="100"
                step="0.5"
              />
              {selectedEmployee && percentageValue && (
                <p className="text-sm text-gray-600 mt-2">
                  Equivale a: <span className="font-bold text-[#FF8C00]">
                    ${estimatedAmount.toLocaleString('es-CO')} COP
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Estimated Amount Display */}
          {estimatedAmount > 0 && (
            <div className="bg-[#FF8C00] bg-opacity-10 border border-[#FF8C00] rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-1">Monto Total del Bono:</p>
              <p className="text-2xl font-bold text-[#FF8C00]">
                ${estimatedAmount.toLocaleString('es-CO')} COP
              </p>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción / Motivo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
              rows={3}
              placeholder="Ej: Bono por cumplimiento de objetivos Q1 2026"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Fecha de Pago (Nómina) *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Selecciona la fecha en que se pagará este bono (generalmente día 30 de cada mes)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/bonuses"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition text-center"
            >
              Cancelar
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !userId || !paymentDate || estimatedAmount <= 0}
              className="flex-1 flex items-center justify-center gap-2 bg-[#FF8C00] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Bono'}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
