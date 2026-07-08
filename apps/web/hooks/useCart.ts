/**
 * ============================================================
 * MOCK CART — UX/UI Development Phase
 * ============================================================
 * ใช้ localStorage เก็บ cart state ชั่วคราวเพื่อพัฒนา UX/UI
 * ตาม frontend/skill.md ข้อ 7: cart จริงต้องเก็บใน cart-svc
 *
 * TODO: [cart-svc] Replace localStorage operations with cart-svc API via api-gateway:
 *   addItem()        → POST   {API_GATEWAY}/carts/:cartId/items
 *   updateQuantity() → PATCH  {API_GATEWAY}/carts/:cartId/items/:itemId
 *   removeItem()     → DELETE {API_GATEWAY}/carts/:cartId/items/:itemId
 *   clearCart()      → DELETE {API_GATEWAY}/carts/:cartId
 *   (init cart)      → POST   {API_GATEWAY}/carts   (guest: sessionId, user: customerId)
 *
 * TODO: [cart-svc] Cart badge count (totalItems) should come from GET /carts/:cartId
 * TODO: [auth-svc] After login → POST /carts/merge (guestCartId + customerId)
 * TODO: [cart-svc] CartItem.color/title/brand are display fields not in cart-svc schema —
 *   decide: store variantId in CartItem OR fetch display data from product-svc on load
 * ============================================================
 */

"use client";

import { useState, useEffect } from "react";

export interface CartItem {
  /** Local composite key: `${productId}-${color}`. In production: cartItemId (UUID from cart-svc) */
  id: string;
  /** In production: UUID matching product-svc product ID */
  productId: string;
  title: string;
  price: number;
  quantity: number;
  /** Selected color variant — not stored in cart-svc schema yet. TODO: add variantId to CartItem schema */
  color: string;
  /** TODO: [r2] Will be Cloudflare R2 URL from product-svc */
  imageUrl: string;
  brand: string;
}


export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load items from localStorage
  const loadCart = () => {
    try {
      const stored = localStorage.getItem("mg_cart_items");
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Failed to load cart items", e);
    }
  };

  useEffect(() => {
    loadCart();

    const handleUpdate = () => {
      loadCart();
    };

    window.addEventListener("mg_cart_updated", handleUpdate);
    return () => window.removeEventListener("mg_cart_updated", handleUpdate);
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    try {
      localStorage.setItem("mg_cart_items", JSON.stringify(newItems));
      setItems(newItems);
      // Dispatch custom event to notify other instances of useCart
      window.dispatchEvent(new Event("mg_cart_updated"));
    } catch (e) {
      console.error("Failed to save cart items", e);
    }
  };

  const addItem = (item: Omit<CartItem, "id">) => {
    const id = `${item.productId}-${item.color}`;
    const existingIndex = items.findIndex((i) => i.id === id);
    let newItems = [...items];

    if (existingIndex > -1) {
      const existingItem = newItems[existingIndex];
      if (existingItem) {
        existingItem.quantity += item.quantity;
      }
    } else {
      newItems.push({ ...item, id });
    }
    saveCart(newItems);
  };

  const addMultipleItems = (itemsToAdd: Omit<CartItem, "id">[]) => {
    let newItems = [...items];
    itemsToAdd.forEach((item) => {
      const id = `${item.productId}-${item.color}`;
      const existingIndex = newItems.findIndex((i) => i.id === id);
      if (existingIndex > -1) {
        const existingItem = newItems[existingIndex];
        if (existingItem) {
          existingItem.quantity += item.quantity;
        }
      } else {
        newItems.push({ ...item, id });
      }
    });
    saveCart(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    saveCart(newItems);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    const newItems = items.map((i) => (i.id === id ? { ...i, quantity } : i));
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return {
    items,
    addItem,
    addMultipleItems,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
