/**
 * API Client — apps/web/lib/api.ts
 * Typed fetch wrapper ชี้ไปที่ API Gateway
 * ใช้งาน: import { cartApi, orderApi, paymentApi } from "@/lib/api"
 */

import { getAccessToken } from "./auth";

/** Base URL ชี้ไป API Gateway ตาม port map */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788";

// ──────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────────

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } })?.error?.message ??
      `Request failed: ${res.status}`;
    throw new Error(message);
  }

  // 204 No Content — return empty
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────────────────────────────────────────
// Cart API
// ──────────────────────────────────────────────────────────────────────────────

export interface CartItemPayload {
  productId: string;
  quantity: number;
  price: number;
  color?: string;
  title?: string;
  imageUrl?: string;
  brand?: string;
}

export const cartApi = {
  /** POST /carts */
  create: (customerId?: string | null) =>
    apiRequest<{ cartId: string; items: unknown[] }>("/carts", {
      method: "POST",
      body: JSON.stringify({ customerId: customerId ?? null }),
    }),

  /** GET /carts/:cartId */
  get: (cartId: string) => apiRequest<{ cartId: string; items: unknown[] }>(`/carts/${cartId}`),

  /** GET /carts/customer/:customerId */
  getByCustomer: (customerId: string) =>
    apiRequest<{ cartId: string; items: unknown[] }>(`/carts/customer/${customerId}`).catch(
      (e) => { if (e.message.includes("404") || e.message.includes("ไม่พบ")) return null; throw e; }
    ),

  /** POST /carts/:cartId/items */
  addItem: (cartId: string, item: CartItemPayload) =>
    apiRequest<unknown>(`/carts/${cartId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    }),

  /** PATCH /carts/:cartId/items/:itemId */
  updateItem: (cartId: string, itemId: string, quantity: number) =>
    apiRequest<unknown>(`/carts/${cartId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  /** DELETE /carts/:cartId/items/:itemId */
  removeItem: (cartId: string, itemId: string) =>
    apiRequest<void>(`/carts/${cartId}/items/${itemId}`, { method: "DELETE" }),

  /** DELETE /carts/:cartId */
  clear: (cartId: string) =>
    apiRequest<void>(`/carts/${cartId}`, { method: "DELETE" }),

  /** POST /carts/merge */
  merge: (guestCartId: string, customerId: string) =>
    apiRequest<{ cartId: string; items: unknown[] }>("/carts/merge", {
      method: "POST",
      body: JSON.stringify({ guestCartId, customerId }),
    }),
};

// ──────────────────────────────────────────────────────────────────────────────
// Order API
// ──────────────────────────────────────────────────────────────────────────────

export interface ShippingAddressSnapshot {
  receiverName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  province: string;
  city: string;
  postalCode: string;
}

export interface CreateOrderPayload {
  cartId: string;
  addressId: string;
  remark?: string | null;
  shippingAddressSnapshot: ShippingAddressSnapshot;
}

export const orderApi = {
  /** POST /orders — สร้าง order จาก checkout */
  create: (payload: CreateOrderPayload) =>
    apiRequest<{ orderId: string; status: string }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** GET /orders/:orderId */
  get: (orderId: string) =>
    apiRequest<{ orderId: string; status: string; items: unknown[] }>(`/orders/${orderId}`),

  /** GET /orders?customerId=xxx&page=1&limit=20 */
  list: (customerId: string, opts?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams({ customerId });
    if (opts?.status) params.set("status", opts.status);
    if (opts?.page)   params.set("page", String(opts.page));
    if (opts?.limit)  params.set("limit", String(opts.limit));
    return apiRequest<{ orders: unknown[]; total: number }>(`/orders?${params}`);
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Payment API
// ──────────────────────────────────────────────────────────────────────────────

export interface CreatePaymentPayload {
  orderId: string;
  paymentMethod: "credit_card" | "promptpay" | "bank_transfer";
  token: string; // Omise token or "mock-payment" for dev
}

export const paymentApi = {
  /** POST /payments */
  pay: (payload: CreatePaymentPayload) =>
    apiRequest<{ paymentId: string; status: string; transactionRef: string }>("/payments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** POST /payments/:paymentId/refund (Admin only) */
  refund: (paymentId: string) =>
    apiRequest<{ paymentId: string; status: string }>(`/payments/${paymentId}/refund`, {
      method: "POST",
    }),
};
