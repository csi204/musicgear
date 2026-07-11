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
    } else if (payload.event === "product.deleted") {
      // 1. ลบสต็อกและประวัติคงคลังในฝั่ง inventory-svc
      await db.inventoryLog.deleteMany({ where: { productId: payload.productId } });
      await db.inventory.deleteMany({ where: { productId: payload.productId } });
      console.info(`[QStash] product.deleted — Deleted inventory for productId=${payload.productId}`);

      // 2. ส่งต่อ Event นี้ไปยัง report-svc และ notification-svc
      const qstashUrl = c.env.QSTASH_URL;
      const qstashToken = c.env.QSTASH_TOKEN;
      const subscribers = [];
      if (c.env.NOTIFICATION_SVC_URL) {
        subscribers.push(`${c.env.NOTIFICATION_SVC_URL.replace(/\/$/, "")}/webhooks/qstash`);
      }
      if (c.env.REPORT_SVC_URL) {
        subscribers.push(`${c.env.REPORT_SVC_URL.replace(/\/$/, "")}/webhooks/qstash`);
      }

      if (qstashUrl && qstashToken && subscribers.length > 0) {
        c.executionCtx.waitUntil(
          Promise.all(
            subscribers.map((subscriberUrl) =>
              fetch(`${qstashUrl}/v2/publish/${subscriberUrl}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${qstashToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  event: "product.deleted",
                  productId: payload.productId,
                }),
              }).then(async (res) => {
                if (!res.ok) {
                  const text = await res.text();
                  console.error(`[inventory-svc] QStash relay error for ${subscriberUrl}: ${text}`);
                } else {
                  console.info(`[inventory-svc] QStash event product.deleted relaid successfully to ${subscriberUrl}`);
                }
              }).catch(err => {
                console.error(`[inventory-svc] QStash relay to ${subscriberUrl} failed:`, err);
              })
            )
          )
        );
      }
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
