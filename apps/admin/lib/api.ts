/**
 * API Client for Admin Dashboard
 * Uses NEXT_PUBLIC_API_URL env var:
 *   - Local:      http://localhost:8787  (wrangler dev)
 *   - Production: https://musicgear-api-gateway.thunderwolf2209.workers.dev
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://musicgear-api-gateway.thunderwolf2209.workers.dev";

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
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

/** GET /users — list all users (admin only, uses QUERY method for body filtering) */
export async function getUsers(query: UserListQuery = {}, token?: string): Promise<UserListResponse> {
  // Use QUERY method to send filter as body (per QUERY HTTP spec)
  return apiFetch<UserListResponse>("/users", {
    method: "QUERY",
    body: JSON.stringify(query),
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
  data: { firstName?: string; lastName?: string; phone?: string },
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

/** QUERY /reports/inventory-alerts — list low stock items */
export async function getInventoryAlerts(query: { limit?: number; status?: string } = {}, token?: string) {
  return apiFetch("/reports/inventory-alerts", {
    method: "QUERY",
    body: JSON.stringify(query),
    token,
  });
}
