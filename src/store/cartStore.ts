import { create } from 'zustand';
import { CartItem, Product } from '@/types/database';

interface CartState {
  cart: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => { subtotal: number; tax: number; total: number };
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
  }
}));