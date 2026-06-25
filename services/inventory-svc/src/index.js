import { Hono } from "hono";
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import { stockRoutes } from "./routes/stock.js";

const app = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// Auth Middleware — ทุก request ต้องผ่าน verifyKindeToken ก่อน
// ยกเว้น health check
// ──────────────────────────────────────────────────────────────────────────────
app.use("/stock/*", (c, next) => {
  const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");
  return authMiddleware(c, next);
});

// ──────────────────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "inventory-svc" }));

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.route("/stock", stockRoutes);

export default app;
