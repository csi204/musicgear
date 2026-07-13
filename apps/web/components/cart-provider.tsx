"use client";

/**
 * CartProvider — apps/web/components/cart-provider.tsx
 * React Context ห่อ app ทั้งหมด ให้ทุก component เรียกใช้ useCart() ได้
 *
 * วิธีใช้งาน:
 * 1. ใส่ <CartProvider> ใน apps/web/app/layout.tsx ครอบ children
 * 2. ใน component ใดก็ได้: import { useCartContext } from "@/components/cart-provider"
 */

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useCart, type CartItem } from "../hooks/useCart";

// ──────────────────────────────────────────────────────────────────────────────
// Context Shape
// ──────────────────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  cartId: string | null;
  loading: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  addMultipleItems: (items: Omit<CartItem, "id">[]) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ──────────────────────────────────────────────────────────────────────────────
// Provider Component
// ──────────────────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart();

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Consumer Hook
// ──────────────────────────────────────────────────────────────────────────────

/**
 * useCartContext — ใช้แทน useCart() ใน component ที่อยู่ภายใต้ <CartProvider>
 * จะ throw error ถ้าใช้นอก Provider (ป้องกัน bug)
 */
export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used inside <CartProvider>");
  }
  return ctx;
}
