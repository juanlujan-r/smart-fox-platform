'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';

interface ProductFormProps {
  initialData?: Product;
  onSuccess: () => void;
}

const categories = ['beverages', 'desserts', 'food'];

export default function ProductForm({ initialData, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    category_id: initialData?.category_id || '',
    image_url: initialData?.image_url || '',
  });

  // Removed useEffect to fix setState-in-effect lint error
  // State is initialized directly from initialData prop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Asegúrate de que los campos coincidan con los de tu SQL
    const { error } = await supabase.from('products').insert([
      { 
        name: formData.name, 
        price: formData.price, 
        stock: formData.stock, 
        category_id: 1, // Por ahora fijo o cámbialo a un select
        image_url: formData.image_url 
      }
    ]);
    
    if (!error) {
      onSuccess(); // Esta función debe llamar al fetchProducts de la página principal
    } else {
      alert("Error: " + error.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
        {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
        <input
          type="number"
          name="stock"
          value={formData.stock}
          onChange={handleChange}
          min="0"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
        {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        >
          <option value="">Seleccionar categoría</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de Imagen</label>
        <input
          type="url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Guardando...' : initialData ? 'Actualizar Producto' : 'Agregar Producto'}
      </button>
    </form>
  );
}
