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
  processSale: () => Promise<{ success: boolean; message?: string }>;
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
  processSale: async () => {
    const { cart, getTotal, clearCart } = get();
    const { total, tax } = getTotal();

    if (cart.length === 0) return { success: false, message: "Carrito vacío" };

    try {
      // 1. Crear la Orden
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{ total, tax, status: 'completed' }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Crear los items (detalles)
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      clearCart();
      return { success: true };
    } catch (error: unknown) {
      return { success: false, message: (error as Error).message };
    }
  },
}));