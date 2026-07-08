import { getAccessToken, getApiBaseUrl } from "./auth";

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  // Resolve base URL: use getApiBaseUrl() if window is defined (client-side) or fallback to env var
  const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
  const activeToken = token ?? (typeof window !== "undefined" ? getAccessToken() : undefined);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const res = await fetch(`${apiBase}${path}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message ?? `API error ${res.status}`);
  }
  return res.json();
}

// ──────────────────────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────────────────────

export interface ProductRecord {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: "active" | "inactive" | "discontinued" | "out_of_stock";
  skillLevel?: "beginner" | "intermediate" | "advanced" | null;
  description?: string | null;
  brand: { brandId: string; name: string };
  category: { categoryId: string; name: string };
  images: { imageId: string; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
}

export interface InventoryRecord {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  available: number;
  reorderPoint: number;
  status: "In Stock" | "Low" | "Critical";
}

export interface BundleRecord {
  bundleId: string;
  name: string;
  description?: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  items: {
    bundleItemId: string;
    bundleId: string;
    productId: string;
    quantity: number;
    product: {
      productId: string;
      name: string;
      sku: string;
      price: number;
    };
  }[];
}

export interface OrderItemRecord {
  orderItemId: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShipmentRecord {
  shipmentId: string;
  orderId: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippingStatus: "preparing" | "shipped" | "in_transit" | "delivered" | "returned";
  shippingDate?: string | null;
  deliveredDate?: string | null;
}

export interface OrderRecord {
  orderId: string;
  customerId: string;
  addressId: string;
  orderDate: string;
  shippingAddressSnapshot: any;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  status: "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";
  remark?: string | null;
  items: OrderItemRecord[];
  shipment?: ShipmentRecord | null;
}

export interface DashboardReportData {
  salesTrend: { reportDate: string; totalOrders: number; totalRevenue: number }[];
  topProducts: { productName: string; category: string; quantitySold: number; revenue: number }[];
  categoryDistribution: { category: string; value: number }[];
  inventory: {
    health: { name: string; value: number; color: string }[];
    byCategory: { category: string; stockLevel: number }[];
    alerts: { productId: string; productName: string; category: string; stockLevel: number; reorderPoint: number; status: string }[];
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// API Endpoints
// ──────────────────────────────────────────────────────────────────────────────

/** GET /products — List all products */
export async function getProducts(query: { limit?: number; page?: number; search?: string } = {}, token?: string): Promise<{ products: ProductRecord[]; total: number }> {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.page) params.set("page", String(query.page));
  if (query.search) params.set("search", query.search);
  params.set("status", "all"); // Fetch both active and inactive products for staff view

  const path = `/products?${params.toString()}`;
  return apiFetch<{ products: ProductRecord[]; total: number }>(path, { method: "GET", token });
}

/** GET /inventory/stock — List all stock records directly from inventory-svc */
export async function getInventory(token?: string): Promise<{ inventories: InventoryRecord[] }> {
  return apiFetch<{ inventories: InventoryRecord[] }>("/inventory/stock", { method: "GET", token });
}

/** GET /products/bundles — List all bundles with component details */
export async function getBundles(token?: string): Promise<{ bundles: BundleRecord[] }> {
  return apiFetch<{ bundles: BundleRecord[] }>("/products/bundles", { method: "GET", token });
}

/** GET /orders — List all orders in the queue (or filter by status/page) */
export async function getOrders(query: { status?: string; page?: number; limit?: number } = {}, token?: string): Promise<{ orders: OrderRecord[]; total: number }> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  return apiFetch<{ orders: OrderRecord[]; total: number }>(`/orders?${params.toString()}`, { method: "GET", token });
}

/** PATCH /orders/:orderId/status — Update status of an order */
export async function updateOrderStatus(orderId: string, status: string, token?: string): Promise<OrderRecord> {
  return apiFetch<OrderRecord>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
    token,
  });
}

/** POST /inventory/stock/adjust — Receive or adjust stock manually */
export async function adjustStock(
  data: { productId: string; changeQty: number; action: "receive" | "adjust"; staffId?: string },
  token?: string
): Promise<{ adjusted: boolean; productId: string; beforeQty: number; afterQty: number }> {
  return apiFetch<{ adjusted: boolean; productId: string; beforeQty: number; afterQty: number }>("/inventory/stock/adjust", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

/** GET /reports/dashboard-summary — Fetch dashboard summary reports */
export async function getDashboardSummary(start: string, end: string, token?: string): Promise<DashboardReportData> {
  const params = new URLSearchParams({ start, end });
  return apiFetch<DashboardReportData>(`/reports/dashboard-summary?${params.toString()}`, { method: "GET", token });
}

/** GET /reports/inventory-alerts — Fetch low/critical inventory alerts */
export async function getInventoryAlerts(query: { limit?: number; page?: number } = {}, token?: string): Promise<{ alerts: any[] }> {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", String(query.limit));
  if (query.page) params.set("page", String(query.page));

  return apiFetch<{ alerts: any[] }>(`/reports/inventory-alerts?${params.toString()}`, { method: "GET", token });
}
