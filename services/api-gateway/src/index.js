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
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.all("/auth/*", (c) => c.env.AUTH_SVC.fetch(c.req.raw));
app.all("/users/*", (c) => c.env.USER_SVC.fetch(c.req.raw));
app.all("/products/*", (c) => c.env.PRODUCT_SVC.fetch(c.req.raw));
app.all("/payments/*", (c) => c.env.PAYMENT_SVC.fetch(c.req.raw));
app.all("/orders/*", (c) => c.env.ORDER_SVC.fetch(c.req.raw));
app.all("/carts/*", (c) => c.env.CART_SVC.fetch(c.req.raw));
app.all("/notifications/*", (c) => c.env.NOTIFICATION_SVC.fetch(c.req.raw));
app.all("/reports/*", (c) => c.env.REPORT_SVC.fetch(c.req.raw));
app.all("/inventory/*", (c) => c.env.INVENTORY_SVC.fetch(c.req.raw));

app.get("/health", (c) => c.json({ status: "ok", service: "api-gateway" }));

export default app;