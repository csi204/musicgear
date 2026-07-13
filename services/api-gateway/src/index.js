import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// Allow cross-origin requests from all frontend portals (local dev + production)
app.use("*", cors({
  origin: [
    "http://localhost:8800",
    "http://127.0.0.1:8800",
    "http://localhost:8798",
    "http://127.0.0.1:8798",
    "http://localhost:8799",
    "http://127.0.0.1:8799",
    "https://musicgear-web.thunderwolf2209.workers.dev",
    "https://musicgear-admin.thunderwolf2209.workers.dev",
    "https://musicgear-staff.thunderwolf2209.workers.dev",
  ],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "QUERY"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Helper to proxy requests with direct HTTP fallback
async function proxyRequest(c, binding, fallbackUrl) {
  // 1. Try using the Service Binding
  if (binding && typeof binding.fetch === "function") {
    try {
      const res = await binding.fetch(c.req.raw.clone());
      if (res.status !== 503) {
        return res;
      }
      console.warn(`[Gateway Binding] 503 Worker Not Found for path: ${c.req.path}, falling back to direct HTTP`);
    } catch (err) {
      console.warn(`[Gateway Binding] Error proxying to service:`, err.message, `, falling back to direct HTTP`);
    }
  }

  // 2. Fallback to direct HTTP fetch
  const targetUrl = new URL(c.req.url);
  const fallbackTarget = `${fallbackUrl}${targetUrl.pathname}${targetUrl.search}`;
  console.info(`[Gateway Fallback] Proxying request directly to: ${fallbackTarget}`);
  
  const headers = new Headers(c.req.header());
  const hasBody = !["GET", "HEAD"].includes(c.req.method);
  
  return fetch(fallbackTarget, {
    method: c.req.method,
    headers,
    body: hasBody ? c.req.raw.clone().body : null,
    redirect: "manual"
  });
}

const handleProxy = (bindingName, fallbackUrl) => {
  return async (c) => {
    const binding = c.env[bindingName];
    return proxyRequest(c, binding, fallbackUrl);
  };
};

// Local credentials auth is handled by user-svc
app.post("/auth/register", handleProxy("USER_SVC", "http://localhost:8796"));
app.post("/auth/verify", handleProxy("USER_SVC", "http://localhost:8796"));
app.post("/auth/forgot-password", handleProxy("USER_SVC", "http://localhost:8796"));
app.post("/auth/reset-password", handleProxy("USER_SVC", "http://localhost:8796"));

// All other auth (Kinde OAuth) goes to auth-svc
app.all("/auth/*", handleProxy("AUTH_SVC", "http://localhost:8789"));
app.all("/users", handleProxy("USER_SVC", "http://localhost:8796"));
app.all("/users/*", handleProxy("USER_SVC", "http://localhost:8796"));
app.all("/products", handleProxy("PRODUCT_SVC", "http://localhost:8794"));
app.all("/products/*", handleProxy("PRODUCT_SVC", "http://localhost:8794"));
app.all("/payments", handleProxy("PAYMENT_SVC", "http://localhost:8793"));
app.all("/payments/*", handleProxy("PAYMENT_SVC", "http://localhost:8793"));
app.all("/orders", handleProxy("ORDER_SVC", "http://localhost:8792"));
app.all("/orders/*", handleProxy("ORDER_SVC", "http://localhost:8792"));
app.all("/carts", handleProxy("CART_SVC", "http://localhost:8790"));
app.all("/carts/*", handleProxy("CART_SVC", "http://localhost:8790"));
app.all("/notifications", handleProxy("NOTIFICATION_SVC", "http://localhost:8791"));
app.all("/notifications/*", handleProxy("NOTIFICATION_SVC", "http://localhost:8791"));
app.all("/reports", handleProxy("REPORT_SVC", "http://localhost:8795"));
app.all("/reports/*", handleProxy("REPORT_SVC", "http://localhost:8795"));
app.all("/inventory", handleProxy("INVENTORY_SVC", "http://localhost:8797"));
app.all("/inventory/*", handleProxy("INVENTORY_SVC", "http://localhost:8797"));

app.get("/health", (c) => c.json({ status: "ok", service: "api-gateway" }));

export default app;