'use client';

import { Plus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types/database';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleClick = () => addItem(product);

  const stockStatus = product.stock > 0 ? 'In Stock' : 'Out of Stock';
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price);

  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={handleClick}
    >
      <div className="aspect-square bg-gray-200 flex items-center justify-center">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 text-center">No Image</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-800 mb-1">{product.name}</h3>
        <p
          className={`text-sm font-medium ${
            product.stock > 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {stockStatus}
        </p>
        <p className="text-xl font-bold text-gray-800 mt-2">{formattedPrice}</p>
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
        <Plus className="w-12 h-12 text-white" />
      </div>
    </div>
  );
}
