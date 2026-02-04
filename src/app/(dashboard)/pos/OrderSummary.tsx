'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function OrderSummary() {
  const { cart, updateQuantity, getTotal, processSale } = useCartStore();
  const { subtotal, tax, total } = getTotal();
  const [loading, setLoading] = useState(false);

  const handleIncrease = (id: string, currentQty: number) => {
    updateQuantity(id, currentQty + 1);
  };

  const handleDecrease = (id: string, currentQty: number) => {
    updateQuantity(id, Math.max(0, currentQty - 1));
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      await processSale();
      alert('Venta Guardada');
    } catch (error: unknown) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Summary</h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">No items in cart</p>
      ) : (
        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">{item.name}</h3>
                <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDecrease(item.id, item.quantity)}
                  className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => handleIncrease(item.id, item.quantity)}
                  className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <button
        className="w-full mt-6 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleProcessPayment}
        disabled={cart.length === 0 || loading}
      >
        {loading ? 'Procesando...' : 'Cobrar'}
      </button>
    </div>
  );
}
