import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import ordersRouter from "./routes/orders.js";
import { qstashWebhookSchema } from "types/src/events.js";
import { createPrisma } from "./db/prisma.js";
import { OrderService } from "./services/order.service.js";

const app = new Hono()
const authMiddleware = createAuthMiddleware();

app.get('/', (c) => c.json({ status: 'ok', service: 'order-svc' }));

// Helper to publish order status change to QStash (with direct HTTP fallback for local testing)
async function publishOrderStatusChanged(env, orderId, customerId, status) {
  const qstashUrl = env.QSTASH_URL;
  const qstashToken = env.QSTASH_TOKEN;
  let cleanNotificationUrl = env.NOTIFICATION_SVC_URL || "";
  if (cleanNotificationUrl.endsWith("/")) {
    cleanNotificationUrl = cleanNotificationUrl.slice(0, -1);
  }
  const subscriberUrl = `${cleanNotificationUrl}/webhooks/qstash`;

  const payload = {
    event: "order.status_changed",
    orderId,
    customerId,
    status,
  };

  if (!qstashUrl || !qstashToken || !env.NOTIFICATION_SVC_URL) {
    console.warn("[order-svc] QStash not configured — falling back to direct HTTP request");
    try {
      await fetch(subscriberUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`[order-svc] Failed to fetch local notification webhook:`, err.message);
    }
    return;
  }

  try {
    const res = await fetch(`${qstashUrl}/v2/publish/${subscriberUrl}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${qstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[order-svc] QStash error ${res.status}: ${text}`);
    }
  } catch (err) {
    console.error(`[order-svc] QStash publish error:`, err.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /webhooks/qstash — QStash Subscriber
// ──────────────────────────────────────────────────────────────────────────────
app.post("/webhooks/qstash", async (c) => {
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
  const db = createPrisma(c.env.DATABASE_URL);

  try {
    if (payload.event === "payment.success") {
      await OrderService.updateOrderStatus(db, payload.orderId, "confirmed");
      console.info(`[QStash] payment.success — confirmed orderId=${payload.orderId}`);

      // Publish order.status_changed to QStash asynchronously
      c.executionCtx.waitUntil(
        publishOrderStatusChanged(c.env, payload.orderId, payload.customerId, "confirmed")
      );
    } else if (payload.event === "address.created" || payload.event === "address.updated") {
      console.info(`[QStash] Ignored deprecated address sync event: ${payload.event}`);
    } else {
      console.info(`[QStash] Ignored event: ${payload.event}`);
    }

    return c.json({ ok: true }, 200);
  } catch (err) {
    console.error("[POST /webhooks/qstash] Error processing event:", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to process event" } }, 500);
  }
});

// Apply Kinde Auth to all order routes
app.use('/orders/*', authMiddleware);
app.route('/orders', ordersRouter);

export default app
