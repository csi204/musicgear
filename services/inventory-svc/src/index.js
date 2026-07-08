import { Hono } from "hono";
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import { stockRoutes } from "./routes/stock.js";
import { qstashWebhookSchema } from "types/src/events.js";
import { createClient } from "./db/client.js";
import { initializeInventory } from "./services/inventory.service.js";

const app = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// Auth Middleware — ทุก request ต้องผ่าน verifyToken ก่อน
// ยกเว้น health check และ webhooks
// ──────────────────────────────────────────────────────────────────────────────
const authMiddleware = (c, next) => createAuthMiddleware()(c, next);
app.use("/stock", authMiddleware);
app.use("/stock/*", authMiddleware);
app.use("/inventory/stock", authMiddleware);
app.use("/inventory/stock/*", authMiddleware);

// ──────────────────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "inventory-svc" }));
app.get("/inventory", (c) => c.json({ status: "ok", service: "inventory-svc" }));

// ──────────────────────────────────────────────────────────────────────────────
// POST /webhooks/qstash — QStash Subscriber (สำหรับซิงค์ข้อมูลสต็อกเริ่มต้น)
// ──────────────────────────────────────────────────────────────────────────────
const qstashHandler = async (c) => {
  let rawBody;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400);
  }

  const parsed = qstashWebhookSchema.safeParse(rawBody);
  if (!parsed.success) {
    console.warn("[POST /webhooks/qstash] Unrecognized event shape:", rawBody);
    return c.json(
      { error: { code: "UNRECOGNIZED_EVENT", message: "Event type not supported or payload invalid" } },
      400
    );
  }

  const payload = parsed.data;
  const db = createClient(c.env.DATABASE_URL);

  try {
    if (payload.event === "product.created") {
      await initializeInventory(db, payload.productId);
      console.info(`[QStash] product.created — Initialized inventory for productId=${payload.productId}`);
    } else {
      console.info(`[QStash] Ignored event: ${payload.event}`);
    }

    return c.json({ ok: true }, 200);
  } catch (err) {
    console.error("[POST /webhooks/qstash] Error processing event:", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to process event" } }, 500);
  }
};

app.post("/webhooks/qstash", qstashHandler);
app.post("/inventory/webhooks/qstash", qstashHandler);

// ──────────────────────────────────────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────────────────────────────────────
app.route("/stock", stockRoutes);
app.route("/inventory/stock", stockRoutes);

export default app;
