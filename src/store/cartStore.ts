import { create } from 'zustand';
import { CartItem, Product } from '@/types/database';
import { supabase } from '@/lib/supabase';

interface CartState {
  cart: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => { subtotal: number; tax: number; total: number };
  processSale: (userId?: string) => Promise<{ success: boolean }>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  addItem: (product) => set((state) => {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      return { cart: state.cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { cart: [...state.cart, { ...product, quantity: 1 }] };
  }),
  removeItem: (id) => set((state) => ({ cart: state.cart.filter(i => i.id !== id) })),
  updateQuantity: (id, qty) => set((state) => ({
    cart: state.cart.map(i => i.id === id ? { ...i, quantity: Math.max(0, qty) } : i)
  })),
  clearCart: () => set({ cart: [] }),
  getTotal: () => {
    const subtotal = get().cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    return { subtotal, tax, total: subtotal + tax };
  },
  processSale: async (userId?: string) => {
    const { cart } = get();
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }
    const { total, tax } = get().getTotal();

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        total,
        tax,
        status: 'completed',
        ...(userId && { user_id: userId }),
      })
      .select('id')
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    const newOrderId = orderData.id;

    // Insert order items
    const orderItems = cart.map((item) => ({
      order_id: newOrderId,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    // Clear cart
    get().clearCart();

    return { success: true };
  },
}));