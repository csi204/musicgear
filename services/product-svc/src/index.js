import { Hono } from "hono";
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import { productRoutes } from "./routes/product.js";

const app = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// Auth Middleware — ทุก request ต้องผ่าน verifyKindeToken ก่อน
// ──────────────────────────────────────────────────────────────────────────────
app.use("/products/*", (c, next) => {
  const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");
  return authMiddleware(c, next);
});

// ──────────────────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "product-svc" }));

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.route("/products", productRoutes);

export default app;
