import { Hono } from 'hono'
import { createAuthMiddleware } from "@musicgear/auth-middleware";
import ordersRouter from "./routes/orders.js";
import { qstashWebhookSchema } from "types/src/events.js";
import { createPrisma } from "./db/prisma.js";

const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");

app.get('/', (c) => c.json({ status: 'ok', service: 'order-svc' }));

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

  try {
    if (payload.event === "address.created" || payload.event === "address.updated") {
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
