import { Hono } from "hono";
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { productRoutes } from "./routes/product.js";

const app = new Hono();
const authMiddleware = createAuthMiddleware();
const adminMiddleware = createRoleMiddleware(["admin"]);

// Auth & Role Middleware — เฉพาะ request ที่ไม่ใช่ GET (POST, PUT, PATCH, DELETE) ต้องเป็น Admin เท่านั้น
app.use("/products", async (c, next) => {
  if (c.req.method === "GET") return await next();
  return authMiddleware(c, async () => {
    return adminMiddleware(c, next);
  });
});

app.use("/products/*", async (c, next) => {
  if (c.req.method === "GET") return await next();
  return authMiddleware(c, async () => {
    return adminMiddleware(c, next);
  });
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
