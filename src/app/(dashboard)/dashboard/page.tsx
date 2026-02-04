import { DollarSign, ShoppingBag, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const currentDate = format(new Date(), 'MMMM d, yyyy');

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
            <p className="text-2xl font-bold text-gray-800">$1.2M</p>
            <p className="text-gray-600">Sales</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-lg flex items-center space-x-4">
          <div className="bg-orange-500 p-3 rounded-full">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">142</p>
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
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Chart Placeholder</p>
          </div>
        </div>

        <div className="w-full lg:w-80 glass-panel p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">Order #1234 completed at 10:30 AM</li>
            <li className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">New staff member added to inventory team</li>
            <li className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">Inventory updated for product XYZ</li>
            <li className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">Payment processed for order #1233</li>
            <li className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">System maintenance completed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
