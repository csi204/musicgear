import { Hono } from "hono";
import { qstashWebhookSchema } from "types/src/events.js";
import { createClient } from "../db/client.js";
import {
  handleOrderStatusChanged,
  handlePaymentSuccess,
  handleStockUpdated,
} from "../services/notification.service.js";

export const webhookRoutes = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// POST /webhooks/qstash — QStash Subscriber
//
// รับ 2 event types จากบุญ:
//   1. order.status_changed — เมื่อสถานะออเดอร์เปลี่ยน
//   2. payment.success      — เมื่อลูกค้าชำระเงินสำเร็จ
//
// ไม่มี verifyKindeToken เพราะ QStash ยิงมาเอง (ใช้ QSTASH_CURRENT_SIGNING_KEY แทน ถ้า production)
// ──────────────────────────────────────────────────────────────────────────────
webhookRoutes.post("/qstash", async (c) => {
  let rawBody;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400);
  }

  // Validate ด้วย Zod discriminated union schema
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
    switch (payload.event) {
      case "order.status_changed":
        await handleOrderStatusChanged(db, payload);
        console.info(`[QStash] order.status_changed — orderId=${payload.orderId} status=${payload.status}`);
        break;

      case "payment.success":
        await handlePaymentSuccess(db, payload);
        console.info(`[QStash] payment.success — orderId=${payload.orderId}`);
        break;

      case "stock.updated":
        await handleStockUpdated(db, payload);
        console.info(`[QStash] stock.updated — productId=${payload.productId} qty: ${payload.beforeQty}→${payload.afterQty}`);
        break;

      default:
        // discriminated union ensures exhaustive, แต่ fallback ไว้กัน
        console.warn("[QStash] Unknown event:", payload);
    }

    // QStash ต้องการ 2xx เพื่อ acknowledge ว่ารับแล้ว ถ้า return 5xx จะ retry
    return c.json({ ok: true }, 200);
  } catch (err) {
    console.error("[POST /webhooks/qstash]", err);
    // Return 500 ให้ QStash retry อีกครั้ง
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to process event" } }, 500);
  }
});
