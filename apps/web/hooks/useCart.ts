/**
 * ============================================================
 * REAL REDIS CART INTEGRATION — Phase 2
 * ============================================================
 * ดึงและจัดการข้อมูลตะกร้าสินค้าจริงผ่าน cart-svc API บน API Gateway
 * รองรับการซิงค์ข้อมูลผู้ใช้จริงจาก Kinde และการผสานตะกร้า Guest
 *
 * endpoints:
 *   addItem()        → POST   {API_GATEWAY}/carts/:cartId/items
 *   updateQuantity() → PATCH  {API_GATEWAY}/carts/:cartId/items/:itemId
 *   removeItem()     → DELETE {API_GATEWAY}/carts/:cartId/items/:itemId
 *   clearCart()      → DELETE {API_GATEWAY}/carts/:cartId
 *   (init cart)      → POST   {API_GATEWAY}/carts
 * ============================================================
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getApiBaseUrl, getAccessToken, fetchCurrentUser } from "../lib/auth";

export interface CartItem {
  /** In Redis production: cartItemId (UUID from cart-svc) */
  id: string;
  /** UUID matching product-svc product ID */
  productId: string;
  title: string;
  price: number;
  quantity: number;
  /** Selected color variant */
  color: string;
  imageUrl: string;
  brand: string;
}

const getHeaders = () => {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const cartApi = {
  async getCart(cartId: string) {
    const res = await fetch(`${getApiBaseUrl()}/carts/${cartId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to get cart");
    return res.json();
  },
  async getCustomerCart(customerId: string) {
    const res = await fetch(`${getApiBaseUrl()}/carts/customer/${customerId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to get customer cart");
    }
    return res.json();
  },
  async createCart(customerId?: string | null) {
    const res = await fetch(`${getApiBaseUrl()}/carts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ customerId: customerId || null }),
    });
    if (!res.ok) throw new Error("Failed to create cart");
    return res.json();
  },
  async addItem(cartId: string, item: { productId: string; quantity: number; price: number; color?: string; title?: string; imageUrl?: string; brand?: string }) {
    const res = await fetch(`${getApiBaseUrl()}/carts/${cartId}/items`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Add item failed:", res.status, text);
      throw new Error(`Failed to add item: ${res.status} ${text}`);
    }
    return res.json();
  },
  async updateItem(cartId: string, itemId: string, quantity: number) {
    const res = await fetch(`${getApiBaseUrl()}/carts/${cartId}/items/${itemId}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error("Failed to update item");
    return res.json();
  },
  async removeItem(cartId: string, itemId: string) {
    const res = await fetch(`${getApiBaseUrl()}/carts/${cartId}/items/${itemId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok && res.status !== 404) {
      throw new Error("Failed to remove item");
    }
  },
  async clearCart(cartId: string) {
    const res = await fetch(`${getApiBaseUrl()}/carts/${cartId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to clear cart");
  },
  async mergeCarts(guestCartId: string, customerId: string) {
    const res = await fetch(`${getApiBaseUrl()}/carts/merge`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ guestCartId, customerId }),
    });
    if (!res.ok) throw new Error("Failed to merge carts");
    return res.json();
  }
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const removingRef = useRef<Set<string>>(new Set());
  const syncVersionRef = useRef<number>(0);

  const syncCart = useCallback(async () => {
    syncVersionRef.current += 1;
    const currentVersion = syncVersionRef.current;

    try {
      const token = getAccessToken();
      let activeCart = null;

      if (token) {
        // User logged in
        const user = await fetchCurrentUser();
        if (currentVersion !== syncVersionRef.current) return;

        if (user) {
          // 1. Try fetching existing customer cart
          activeCart = await cartApi.getCustomerCart(user.id);
          if (currentVersion !== syncVersionRef.current) return;
          
          // 2. If not found, check if we have a local guest cart to merge
          if (!activeCart) {
            const guestCartId = localStorage.getItem("mg_cart_id");
            if (guestCartId) {
              try {
                activeCart = await cartApi.mergeCarts(guestCartId, user.id);
                if (currentVersion !== syncVersionRef.current) return;
                localStorage.removeItem("mg_cart_id"); // clear guest cart reference
              } catch {
                // If merge fails, fall through
              }
            }
          }

          // 3. If still no cart, create one for the user
          if (!activeCart) {
            activeCart = await cartApi.createCart(user.id);
            if (currentVersion !== syncVersionRef.current) return;
          }
        }
      } else {
        // Guest user
        const guestCartId = localStorage.getItem("mg_cart_id");
        if (guestCartId) {
          try {
            activeCart = await cartApi.getCart(guestCartId);
            if (currentVersion !== syncVersionRef.current) return;
          } catch {
            // guest cart expired in Redis, fall through to create
          }
        }

        if (!activeCart) {
          activeCart = await cartApi.createCart(null);
          if (currentVersion !== syncVersionRef.current) return;
        }
      }

      if (activeCart) {
        if (currentVersion !== syncVersionRef.current) return;
        setCartId(activeCart.cartId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedItems: CartItem[] = activeCart.items.map((i: any) => ({
          id: i.cartItemId,
          productId: i.productId,
          title: i.title || "สินค้า",
          price: Number(i.price),
          quantity: i.quantity,
          color: i.color || "",
          imageUrl: i.imageUrl || "",
          brand: i.brand || "",
        }));

        setItems(mappedItems);
        localStorage.setItem("mg_cart_id", activeCart.cartId);
      }
    } catch (e) {
      console.error("Failed to sync cart", e);
    } finally {
      if (currentVersion === syncVersionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    syncCart();

    const handleUpdate = () => {
      syncCart();
    };

    window.addEventListener("mg_cart_updated", handleUpdate);
    return () => window.removeEventListener("mg_cart_updated", handleUpdate);
  }, [syncCart]);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event("mg_cart_updated"));
  };

  const addItem = async (item: Omit<CartItem, "id">) => {
    syncVersionRef.current += 1;
    let currentCartId = cartId;
    if (!currentCartId) {
      // Fallback: load guest cart id from localStorage if hook state not initialized yet
      currentCartId = localStorage.getItem("mg_cart_id");
    }
    if (!currentCartId) return;

    // Save previous state for rollback
    const previousItems = [...items];

    // Check if the item already exists in the cart (so we just increase quantity)
    const existingIndex = items.findIndex(
      (i) => i.productId === item.productId && i.color === item.color
    );

    let optimisticItems = [...items];
    if (existingIndex > -1) {
      const existing = optimisticItems[existingIndex];
      if (existing) {
        optimisticItems[existingIndex] = {
          ...existing,
          quantity: existing.quantity + item.quantity,
        };
      }
    } else {
      optimisticItems.push({
        ...item,
        id: `opt-${crypto.randomUUID()}`, // Temporary ID
      } as CartItem);
    }

    // Optimistically update state
    setItems(optimisticItems);

    try {
      const response = await cartApi.addItem(currentCartId, {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        color: item.color,
        title: item.title,
        imageUrl: item.imageUrl,
        brand: item.brand,
      });

      // Update the optimistic item ID with the real database ID
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id.startsWith("opt-") && i.productId === item.productId && i.color === item.color
            ? { ...i, id: response.cartItemId }
            : i
        )
      );

      triggerUpdate();
    } catch (e) {
      console.error("Failed to add item to cart, rolling back", e);
      setItems(previousItems);
    }
  };

  const addMultipleItems = async (itemsToAdd: Omit<CartItem, "id">[]) => {
    let currentCartId = cartId;
    if (!currentCartId) {
      currentCartId = localStorage.getItem("mg_cart_id");
    }
    if (!currentCartId) return;

    // Save previous state for rollback
    const previousItems = [...items];

    // Optimistically update items
    let optimisticItems = [...items];
    for (const item of itemsToAdd) {
      const existingIndex = optimisticItems.findIndex(
        (i) => i.productId === item.productId && i.color === item.color
      );
      if (existingIndex > -1) {
        const existing = optimisticItems[existingIndex];
        if (existing) {
          optimisticItems[existingIndex] = {
            ...existing,
            quantity: existing.quantity + item.quantity,
          };
        }
      } else {
        optimisticItems.push({
          ...item,
          id: `opt-${crypto.randomUUID()}`,
        } as CartItem);
      }
    }

    setItems(optimisticItems);

    try {
      for (const item of itemsToAdd) {
        await cartApi.addItem(currentCartId, {
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          color: item.color,
          title: item.title,
          imageUrl: item.imageUrl,
          brand: item.brand,
        });
      }
      triggerUpdate();
    } catch (e) {
      console.error("Failed to add multiple items, rolling back", e);
      setItems(previousItems);
    }
  };

  const removeItem = async (id: string) => {
    if (removingRef.current.has(id)) return;
    removingRef.current.add(id);

    syncVersionRef.current += 1;
    const currentVersion = syncVersionRef.current;

    const itemToRemove = items.find((item) => item.id === id);
    if (!itemToRemove) {
      removingRef.current.delete(id);
      return;
    }

    let currentCartId = cartId;
    if (!currentCartId) {
      currentCartId = localStorage.getItem("mg_cart_id");
    }
    if (!currentCartId) {
      removingRef.current.delete(id);
      return;
    }

    // If it's a temporary optimistic ID, we need to wait until the real ID is available
    if (id.startsWith("opt-")) {
      removingRef.current.delete(id);
      
      // Wait for the real ID to be populated in state (from the background addItem response)
      let resolvedId = null;
      for (let attempt = 0; attempt < 15; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        // Check current items state for the real ID
        const matchedItem = items.find(
          (i) => i.productId === itemToRemove.productId && i.color === itemToRemove.color && !i.id.startsWith("opt-")
        );
        if (matchedItem) {
          resolvedId = matchedItem.id;
          break;
        }
      }
      
      if (resolvedId) {
        // Retry with the resolved database ID
        return removeItem(resolvedId);
      } else {
        console.warn("Could not resolve optimistic ID to database ID, force refreshing cart");
        await syncCart();
        return;
      }
    }

    // Save previous state for rollback
    const previousItems = [...items];

    // Optimistically update the state
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));

    try {
      await cartApi.removeItem(currentCartId, id);
      if (currentVersion === syncVersionRef.current) {
        triggerUpdate();
      }
    } catch (e) {
      console.error("Failed to remove item, rolling back", e);
      if (currentVersion === syncVersionRef.current) {
        setItems(previousItems);
      }
    } finally {
      removingRef.current.delete(id);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    syncVersionRef.current += 1;
    const currentVersion = syncVersionRef.current;

    let currentCartId = cartId;
    if (!currentCartId) {
      currentCartId = localStorage.getItem("mg_cart_id");
    }
    if (!currentCartId) return;

    if (quantity <= 0) {
      await removeItem(id);
      return;
    }

    // Save previous state
    const previousItems = [...items];

    // Optimistically update
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );

    try {
      await cartApi.updateItem(currentCartId, id, quantity);
      if (currentVersion === syncVersionRef.current) {
        triggerUpdate();
      }
    } catch (e) {
      console.error("Failed to update quantity, rolling back", e);
      if (currentVersion === syncVersionRef.current) {
        setItems(previousItems);
      }
    }
  };

  const clearCart = async () => {
    syncVersionRef.current += 1;
    const currentVersion = syncVersionRef.current;
    let currentCartId = cartId;
    if (!currentCartId) {
      currentCartId = localStorage.getItem("mg_cart_id");
    }
    if (!currentCartId) return;

    // Save previous state for rollback
    const previousItems = [...items];

    // Optimistically clear items
    setItems([]);

    try {
      await cartApi.clearCart(currentCartId);
      triggerUpdate();
    } catch (e) {
      console.error("Failed to clear cart, rolling back", e);
      setItems(previousItems);
    }
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return {
    items,
    loading,
    cartId,
    addItem,
    addMultipleItems,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
}
