import ProductCard from '@/components/pos/ProductCard';
import OrderSummary from './OrderSummary';
import { Product } from '@/types/database';

const products: Product[] = [
  {
    id: '1',
    name: 'Coffee',
    price: 3.5,
    stock: 10,
    category_id: 'beverages',
  },
  {
    id: '2',
    name: 'Cake',
    price: 5.0,
    stock: 5,
    category_id: 'desserts',
  },
  {
    id: '3',
    name: 'Sandwich',
    price: 7.0,
    stock: 8,
    category_id: 'food',
  },
];

export default function POSPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Point of Sale</h1>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:flex-[2]">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
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
