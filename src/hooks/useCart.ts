import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product } from "@/types";
import { CART_STORAGE_KEY } from "@/config/storeConfig";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  increaseQty: (id: string) => void;
  decreaseQty: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id);
          if (existing) {
            const maxStock = existing.stock ?? Infinity;
            if (existing.cartQuantity >= maxStock) return state; // já no limite
            return {
              items: state.items.map((i) =>
                i.id === product.id
                  ? { ...i, cartQuantity: i.cartQuantity + 1 }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...product, cartQuantity: 1 }] };
        }),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      increaseQty: (id) =>
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i;
            const maxStock = i.stock ?? Infinity;
            if (i.cartQuantity >= maxStock) return i; // já no limite
            return { ...i, cartQuantity: i.cartQuantity + 1 };
          }),
        })),

      decreaseQty: (id) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (item && item.cartQuantity <= 1) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return {
            items: state.items.map((i) =>
              i.id === id ? { ...i, cartQuantity: i.cartQuantity - 1 } : i
            ),
          };
        }),

      setQuantity: (id, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, cartQuantity: Math.max(1, qty) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: CART_STORAGE_KEY } // persiste no localStorage
  )
);

/** Helpers derivados — use fora do create para evitar re-renders desnecessários */
export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.cartQuantity, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.cartQuantity, 0);
