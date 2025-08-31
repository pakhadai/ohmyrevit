import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '@/types';
import toast from 'react-hot-toast';

interface CartState {
  items: CartItem[];

  // Методи
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;

  // Обчислювані значення
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product) => {
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);

        if (existingItem) {
          // Товар вже в кошику - збільшуємо кількість
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          // Додаємо новий товар
          set({ items: [...items, { product, quantity: 1 }] });
        }

        toast.success('Додано в кошик');
      },

      removeItem: (productId: number) => {
        set({
          items: get().items.filter(item => item.product.id !== productId),
        });
        toast.success('Видалено з кошика');
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.is_on_sale
            ? item.product.sale_price || item.product.price
            : item.product.price;
          return total + (price * item.quantity);
        }, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);