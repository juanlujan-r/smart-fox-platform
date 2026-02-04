'use client';

import { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import SalesChart from '@/components/SalesChart';

interface RecentOrder {
  id: string;
  total: number;
  created_at: string;
}

export default function Dashboard() {
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const currentDate = format(new Date(), 'MMMM d, yyyy');

  useEffect(() => {
    const fetchData = async () => {
      // Fetch total stats
      const { data: ordersData, error: ordersError } = await supabase.from('orders').select('total');
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
      } else if (ordersData) {
        const sales = ordersData.reduce((sum, order) => sum + order.total, 0);
        const orders = ordersData.length;
        setTotalSales(sales);
        setTotalOrders(orders);
      }

      // Fetch recent orders
      const { data: recentData, error: recentError } = await supabase
        .from('orders')
        .select('id, total, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('Error fetching recent orders:', recentError);
      } else {
        setRecentOrders(recentData || []);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Resumen Operativo</h1>
        <p className="text-gray-600 mt-1">{currentDate}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-lg flex items-center space-x-4">
          <div className="bg-orange-500 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? 'Cargando...' : formatCurrency(totalSales)}
            </p>
            <p className="text-gray-600">Sales</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex items-center space-x-4">
          <div className="bg-orange-500 p-3 rounded-full">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? 'Cargando...' : totalOrders}
            </p>
            <p className="text-gray-600">Orders</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex items-center space-x-4">
          <div className="bg-orange-500 p-3 rounded-full">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">4/6</p>
            <p className="text-gray-600">Staff</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
        <div className="flex-1 glass-panel p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Sales Chart</h2>
          <SalesChart />
        </div>

        <div className="w-full lg:w-80 glass-panel p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            {recentOrders.map((order) => (
              <li key={order.id} className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                Order #{order.id} - {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })} - {formatCurrency(order.total)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
