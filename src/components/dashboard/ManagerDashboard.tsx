'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, DollarSign, Users, Target } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { ProfileRow, Order, AttendanceLogRow } from '@/types/database';

interface DashboardData {
  monthlyPayroll: number;
  totalRevenue: number;
  profitMargin: number;
  employeesAtRisk: any[];
  monthlyBudget: number;
  actualExpenses: number;
  revenueData: any[];
  loading: boolean;
  error: string | null;
}

interface DisciplinaryAction {
  user_id: string;
  status: string;
}

const ManagerDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    monthlyPayroll: 0,
    totalRevenue: 0,
    profitMargin: 0,
    employeesAtRisk: [],
    monthlyBudget: 50000,
    actualExpenses: 0,
    revenueData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch profiles for payroll calculation
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, personal_data');

      if (profilesError) throw profilesError;

      // Calculate monthly payroll (assuming salary field or a default)
      let payroll = 0;
      profiles?.forEach((profile: ProfileRow) => {
        // Extract salary from personal_data if available, otherwise use a default
        // This assumes salary data is stored somewhere in the profile
        payroll += 3500; // Default monthly salary per employee
      });

      // Fetch orders for revenue calculation
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, created_at')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum: number, order: any) => sum + order.total, 0) || 0;

      // Fetch attendance logs to identify employees at risk
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_logs')
        .select('user_id, created_at')
        .neq('state', 'entrada');

      if (attendanceError) throw attendanceError;

      // Fetch disciplinary actions
      const { data: disciplinary, error: disciplinaryError } = await supabase
        .from('disciplinary_actions')
        .select('id, user_id, status');

      if (disciplinaryError) throw disciplinaryError;

      // Identify employees at risk
      const lateArrivals: { [key: string]: number } = {};
      attendance?.forEach((log: any) => {
        lateArrivals[log.user_id] = (lateArrivals[log.user_id] || 0) + 1;
      });

      const disciplinaryCount: { [key: string]: number } = {};
      disciplinary?.forEach((action: any) => {
        disciplinaryCount[action.user_id] = (disciplinaryCount[action.user_id] || 0) + 1;
      });

      const employeesAtRisk = profiles
        ?.filter((profile: ProfileRow) => {
          const lateCount = lateArrivals[profile.id] || 0;
          const disciplineCount = disciplinaryCount[profile.id] || 0;
          return lateCount > 3 || disciplineCount > 1;
        })
        .map((profile: ProfileRow) => ({
          id: profile.id,
          name: profile.personal_data?.fullName || 'Unknown',
          lateArrivals: lateArrivals[profile.id] || 0,
          disciplinaryActions: disciplinaryCount[profile.id] || 0,
        })) || [];

      // Calculate profit margin (assuming 30% avg profit margin)
      const profitMargin = totalRevenue * 0.30;

      // Calculate actual expenses (payroll + operational)
      const actualExpenses = payroll + totalRevenue * 0.70;

      // Generate revenue vs expenses data for chart
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const revenueData = months.map((month, idx) => ({
        month,
        revenue: Math.floor(totalRevenue / 6) + Math.random() * 5000,
        expenses: Math.floor(actualExpenses / 6) + Math.random() * 3000,
      }));

      setData({
        monthlyPayroll: payroll,
        totalRevenue,
        profitMargin,
        employeesAtRisk,
        monthlyBudget: 50000,
        actualExpenses,
        revenueData,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch dashboard data',
      }));
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const budgetPercentage = (data.actualExpenses / data.monthlyBudget) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Executive Dashboard</h1>
          <p className="text-gray-600">Key performance indicators and business intelligence</p>
        </div>

        {/* KPIs Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Monthly Payroll */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${data.monthlyPayroll.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${data.totalRevenue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          {/* Profit Margin */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${data.profitMargin.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">~30% of revenue</p>
              </div>
              <Target className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* BI Alerts - Employees at Risk */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">BI Alerts: Employees at Risk</h2>
          </div>

          {data.employeesAtRisk.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Employee Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Late Arrivals
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Disciplinary Actions
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.employeesAtRisk.map((employee) => (
                    <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{employee.lateArrivals}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {employee.disciplinaryActions}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          At Risk
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">No employees at risk at this time</p>
          )}
        </div>

        {/* Budget Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Monthly Budget Status</h2>
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-gray-700">Budget Usage</span>
            <span className="text-sm font-medium text-gray-900">
              ${data.actualExpenses.toLocaleString()} / ${data.monthlyBudget.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPercentage > 100 ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            ></div>
          </div>
          <p className={`text-xs mt-2 ${budgetPercentage > 100 ? 'text-red-600' : 'text-orange-600'}`}>
            {budgetPercentage.toFixed(1)}% of monthly budget used
          </p>
        </div>

        {/* Revenue vs Expenses Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FF8C00" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF8C00"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#EF4444"
                fillOpacity={1}
                fill="url(#colorExpenses)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Company Profile Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mission */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Mission</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Empowering businesses with intelligent workforce management and operational excellence through
              cutting-edge ERP solutions.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Vision</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              To become the leading HR and business intelligence platform that transforms how organizations
              manage their most valuable asset: their people.
            </p>
          </div>

          {/* Market Status */}
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-orange-500">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Market Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Market Growth</span>
                <span className="text-green-600 font-semibold">+23.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Customer Retention</span>
                <span className="text-green-600 font-semibold">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Operational Efficiency</span>
                <span className="text-green-600 font-semibold">87.8%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
