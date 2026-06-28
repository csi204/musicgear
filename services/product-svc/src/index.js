import { Hono } from "hono";
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import { productRoutes } from "./routes/product.js";

const app = new Hono();

// Auth Middleware — เฉพาะ request ที่ไม่ใช่ GET (POST, PATCH, DELETE) ต้องผ่าน verifyKindeToken
app.use("/products", async (c, next) => {
  if (c.req.method === "GET") return await next();
  const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");
  return authMiddleware(c, next);
});

app.use("/products/*", async (c, next) => {
  if (c.req.method === "GET") return await next();
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
