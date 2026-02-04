'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { format, subDays, startOfDay } from 'date-fns';

interface ChartData {
  date: string;
  amount: number;
}

export default function SalesChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) {
        console.error('Error fetching sales data:', error);
        setLoading(false);
        return;
      }

      // Group by date and sum totals
      const grouped = orders?.reduce((acc: Record<string, number>, order) => {
        const date = format(new Date(order.created_at), 'dd MMM');
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
      }, {}) || {};

      // Create array for last 7 days
      const chartData: ChartData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'dd MMM');
        chartData.push({
          date,
          amount: grouped[date] || 0,
        });
      }

      setData(chartData);
      setLoading(false);
    };

    fetchSalesData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Cargando gráfico...</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#FF8C00" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Sales']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#FF8C00"
            fillOpacity={1}
            fill="url(#colorSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}