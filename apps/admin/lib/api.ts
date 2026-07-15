import { getApiBaseUrl, getAccessToken } from "./auth";

/**
 * API Client for Admin Dashboard
 */
type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  
  const apiBase = typeof window !== "undefined" ? getApiBaseUrl() : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8788");
  const activeToken = token ?? (typeof window !== "undefined" ? getAccessToken() : undefined);

  const headers: Record<string, string> = {
    ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
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

// --- User Service ---
export type UserRole = "customer" | "staff" | "admin";
export type UserStatus = "active" | "inactive" | "banned";

export interface UserRecord {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  customer?: { customerId: string } | null;
  staff?: { staffId: string; position: string } | null;
  admin?: { adminId: string } | null;
}

export interface UserListResponse {
  status: string;
  users: UserRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

/** GET /users — list all users (admin only) */
export async function getUsers(query: UserListQuery = {}, token?: string): Promise<UserListResponse> {
  const params = new URLSearchParams();
  if (query.page) params.set("page", query.page.toString());
  if (query.limit) params.set("limit", query.limit.toString());
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);

  return apiFetch<UserListResponse>(`/users?${params.toString()}`, {
    method: "GET",
    token,
  });
}

/** POST /users — admin create user (creates in Kinde M2M + DB) */
export async function createUser(
  data: { email: string; firstName: string; lastName: string; role: UserRole; position?: string },
  token?: string
): Promise<{ status: string; user: UserRecord }> {
  return apiFetch("/users", { method: "POST", body: JSON.stringify(data), token });
}

/** DELETE /users/:userId — admin delete user (removes from Kinde + DB) */
export async function deleteUser(userId: string, token?: string): Promise<{ status: string }> {
  return apiFetch(`/users/${userId}`, { method: "DELETE", token });
}

/** PATCH /users/:userId — admin update user profile */
export async function updateUser(
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string; email?: string; role?: UserRole; password?: string },
  token?: string
): Promise<{ status: string; user: UserRecord }> {
  return apiFetch(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data), token });
}

// --- Report Service ---
export interface DashboardData {
  salesTrends: { reportDate: string; totalRevenue: number; totalOrders: number }[];
  topSellingGear: { productName: string; category: string; quantitySold: number; revenue: number }[];
  categoryDistribution: { category: string; value: number }[];
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  stockLevel: number;
  status: string;
  updatedAt: string;
}

/** GET /reports/dashboard — fetch dashboard chart data */
export async function getDashboardData(token?: string): Promise<{ status: string; data: DashboardData }> {
  return apiFetch("/reports/dashboard", { method: "GET", token });
}

/** GET /reports/inventory-alerts — list low stock items */
export async function getInventoryAlerts(query: { limit?: number; status?: string } = {}, token?: string) {
  const params = new URLSearchParams();
  if (query.limit) params.set("limit", query.limit.toString());
  if (query.status) params.set("status", query.status);

  return apiFetch(`/reports/inventory-alerts?${params.toString()}`, {
    method: "GET",
    token,
  });
}

// --- Product Service ---
export interface ProductRecord {
  productId: string;
  name: string;
  slug: string;
  price: number | string;
  originalPrice: number | string | null;
  sku: string;
  status: "active" | "inactive" | "discontinued" | "out_of_stock";
  skillLevel: "beginner" | "intermediate" | "advanced" | null;
  brand: { brandId: string; name: string };
  category: { categoryId: string; name: string };
  images: { imageId: string; imageUrl: string; isPrimary: boolean; sortOrder: number }[];
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  status: string;
  products: ProductRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** GET /products */
export async function getProducts(query: Record<string, any> = {}, token?: string): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value.toString());
    }
  });
  const qs = params.toString();
  return apiFetch<ProductListResponse>(`/products${qs ? `?${qs}` : ''}`, { method: "GET", token });
}

/** DELETE /products/:productId */
export async function deleteProduct(productId: string, token?: string): Promise<{ status: string }> {
  return apiFetch(`/products/${productId}`, { method: "DELETE", token });
}

/** POST /products */
export async function createProduct(formData: FormData, token?: string): Promise<{ status: string; product: ProductRecord }> {
  return apiFetch("/products", { method: "POST", body: formData, token });
}

/** PATCH /products/:productId */
export async function updateProduct(productId: string, formData: FormData, token?: string): Promise<{ status: string; product: ProductRecord }> {
  return apiFetch(`/products/${productId}`, { method: "PATCH", body: formData, token });
}

/** GET /products/brands */
export async function getBrands(token?: string): Promise<{ status: string; brands: { brandId: string; name: string }[] }> {
  return apiFetch("/products/brands", { method: "GET", token });
}

/** GET /products/categories */
export async function getCategories(token?: string): Promise<{ status: string; categories: { categoryId: string; name: string }[] }> {
  return apiFetch("/products/categories", { method: "GET", token });
}

/** GET /products/:productId */
export async function getProductById(productId: string, token?: string): Promise<ProductRecord> {
  return apiFetch(`/products/${productId}`, { method: "GET", token });
}

// --- Bundle Service ---
export interface BundleItem {
  bundleItemId: string;
  bundleId: string;
  productId: string;
  quantity: number;
  product: { productId: string; name: string; sku: string; price: number | string };
}

export interface BundleRecord {
  bundleId: string;
  name: string;
  description: string | null;
  discountType: "percentage" | "fixed_amount";
  discountValue: number | string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  items: BundleItem[];
}

export async function getBundles(token?: string): Promise<{ status: string; bundles: BundleRecord[] }> {
  return apiFetch("/products/bundles", { method: "GET", token });
}

export async function getBundleById(bundleId: string, token?: string): Promise<{ status: string; bundle: BundleRecord }> {
  return apiFetch(`/products/bundles/${bundleId}`, { method: "GET", token });
}

export async function createBundle(data: any, token?: string): Promise<{ status: string; bundle: BundleRecord }> {
  return apiFetch("/products/bundles", { method: "POST", body: JSON.stringify(data), token });
}

export async function updateBundle(bundleId: string, data: any, token?: string): Promise<{ status: string; bundle: BundleRecord }> {
  return apiFetch(`/products/bundles/${bundleId}`, { method: "PUT", body: JSON.stringify(data), token });
}

export async function deleteBundle(bundleId: string, token?: string): Promise<{ status: string }> {
  return apiFetch(`/products/bundles/${bundleId}`, { method: "DELETE", token });
}

// --- Inventory Service ---
export interface InventoryRecord {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  available: number;
  reorderPoint: number;
  maxCapacity: number;
  status: string;
}

/** GET /inventory/stock — Fetch stock for all products */
export async function getInventory(token?: string): Promise<{ inventories: InventoryRecord[] }> {
  return apiFetch("/inventory/stock", { method: "GET", token });
}
