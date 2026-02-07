"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, TrendingUp, Award, Calendar, DollarSign } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';

interface Bonus {
  id: number;
  user_id: string;
  amount: number;
  bonus_type: string;
  percentage: number | null;
  description: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_by: string;
  employee_name: string;
}

export default function BonusesPage() {
  const { t, isClient } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [filteredBonuses, setFilteredBonuses] = useState<Bonus[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadBonuses();
  }, []);

  useEffect(() => {
    filterBonuses();
  }, [bonuses, filterStatus, filterType]);

  const loadBonuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('performance_bonuses')
        .select(`
          id,
          user_id,
          amount,
          bonus_type,
          percentage,
          description,
          start_date,
          end_date,
          status,
          created_by,
          profiles (full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBonuses = data?.map((bonus: any) => ({
        ...bonus,
        employee_name: bonus.profiles?.full_name || 'Unknown',
      })) || [];

      setBonuses(formattedBonuses);
    } catch (err) {
      console.error('Error loading bonuses:', err);
      alert(t('error_adding_bonus'));
    } finally {
      setLoading(false);
    }
  };

  const filterBonuses = () => {
    let filtered = bonuses;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(b => b.bonus_type === filterType);
    }

    setFilteredBonuses(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirm'))) return;

    try {
      const { error } = await supabase
        .from('performance_bonuses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBonuses(bonuses.filter(b => b.id !== id));
      alert(t('delete_bonus_success'));
    } catch (err) {
      console.error('Error deleting bonus:', err);
      alert(t('error_deleting_bonus'));
    }
  };

  const getBonusTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      manual: 'bg-blue-100 text-blue-800',
      performance: 'bg-purple-100 text-purple-800',
      attendance: 'bg-green-100 text-green-800',
      punctuality: 'bg-yellow-100 text-yellow-800',
      schedule_compliance: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getBonusTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      manual: t('manualBonus'),
      performance: t('performanceBonus'),
      attendance: t('attendanceBonus'),
      punctuality: t('punctualityBonus'),
      schedule_compliance: t('scheduleBonus'),
    };
    return labels[type] || type;
  };

  if (!isClient) {
    return null;
  }

  return (
    <RoleGuard allowedRoles={['gerente', 'supervisor']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{t('bonusesManagement')}</h1>
          <Link
            href="/bonuses/new"
            className="flex items-center gap-2 bg-[#FF8C00] text-white px-4 py-2.5 rounded-lg font-bold hover:bg-orange-600 transition"
          >
            <Plus className="w-4 h-4" />
            {t('addBonus')}
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('status')}</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            >
              <option value="all">Todos</option>
              <option value="active">{t('active')}</option>
              <option value="expired">{t('expired')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('bonusType')}</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent outline-none"
            >
              <option value="all">Todos</option>
              <option value="manual">{t('manualBonus')}</option>
              <option value="performance">{t('performanceBonus')}</option>
              <option value="attendance">{t('attendanceBonus')}</option>
              <option value="punctuality">{t('punctualityBonus')}</option>
              <option value="schedule_compliance">{t('scheduleBonus')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF8C00] border-t-transparent" />
          </div>
        ) : filteredBonuses.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">{t('no_bonuses')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBonuses.map((bonus) => (
              <div
                key={bonus.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{bonus.employee_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getBonusTypeColor(bonus.bonus_type)}`}>
                        {getBonusTypeLabel(bonus.bonus_type)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        bonus.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bonus.status === 'active' ? t('active') : t('expired')}
                      </span>
                    </div>
                    {bonus.description && (
                      <p className="text-sm text-gray-600">{bonus.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bonuses/${bonus.id}/edit`}
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-600 hover:text-gray-900"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(bonus.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('amount')}</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${bonus.amount.toLocaleString('es-CO')}
                    </p>
                  </div>
                  {bonus.percentage && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('percentage')}</p>
                      <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {bonus.percentage}%
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('startDate')}</p>
                    <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(bonus.start_date).toLocaleDateString('es-CO')}
                    </p>
                  </div>
                  {bonus.end_date && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('endDate')}</p>
                      <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(bonus.end_date).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
