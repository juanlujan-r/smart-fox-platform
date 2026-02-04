export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}