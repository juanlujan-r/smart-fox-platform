'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const deleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);

      if (error) {
        if (error.code === '23503') { // foreign key violation
          alert('No se puede eliminar el producto porque está vinculado a pedidos existentes.');
        } else {
          alert('Error al eliminar el producto: ' + error.message);
        }
        return;
      }

      // Refresh list
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: unknown) {
      alert('Error: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="glass-panel p-6 rounded-lg">
          <p className="text-center text-gray-500">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="glass-panel p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Inventario</h1>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Agregar Producto</span>
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Imagen</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Precio</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Stock</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Categoría</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">Sin imagen</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">{product.name}</td>
                  <td className="py-3 px-4 text-gray-600">{formatCurrency(product.price)}</td>
                  <td className="py-3 px-4 text-gray-600">{product.stock}</td>
                  <td className="py-3 px-4 text-gray-600">{product.category_id}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button className="p-1 text-red-600 hover:text-red-800 transition-colors" onClick={() => deleteProduct(product.id)}>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <p className="text-center text-gray-500 mt-6">No se encontraron productos.</p>
        )}
      </div>
    </div>
  );
}
