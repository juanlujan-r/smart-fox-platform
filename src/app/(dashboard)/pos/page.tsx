'use client';

import { useEffect, useState } from 'react';
import ProductCard from '@/components/pos/ProductCard';
import OrderSummary from './OrderSummary';
import { Product } from '@/types/database';
import { supabase } from '@/lib/supabase';
import RoleGuard from '@/components/RoleGuard';

function POSPageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-gray-200 rounded-lg shadow-md overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-300"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Point of Sale</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:flex-[2]">
            {loading ? (
              renderSkeleton()
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 lg:flex-[1]">
            <div className="sticky top-6">
              <OrderSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <RoleGuard allowedRoles={['gerente']}>
      <POSPageContent />
    </RoleGuard>
  );
}
