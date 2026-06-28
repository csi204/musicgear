import { Hono } from "hono";
import { createClient } from "../db/client.js";
import { ReportService } from "../services/ReportService.js";
import { qstashWebhookSchema } from "types/src/events.js";

export class WebhookController {
  constructor() {
    this.router = new Hono();
    this.registerRoutes();
  }

  registerRoutes() {
    this.router.post("/qstash", async (c) => {
      const body = await c.req.json();
      const parsed = qstashWebhookSchema.safeParse(body);
      
      if (!parsed.success) {
        return c.json({ error: "Invalid webhook payload", details: parsed.error }, 400);
      }

      const event = parsed.data;
      const db = createClient(c.env.DATABASE_URL);
      const reportService = new ReportService(db);

      try {
        // Determine reference ID based on event type
        const refId = event.orderId || event.productId || event.addressId || "unknown";
        
        // Log every event to SystemAuditLog
        await reportService.logAuditEvent(event.event, refId, event);

        // Specific business logic for payment.success
        if (event.event === "payment.success" && event.amount) {
          await reportService.updateDailySales(event.amount);
        }

        return c.json({ success: true, message: "Webhook processed" }, 200);
      } catch (err) {
        console.error("[POST /webhooks/qstash]", err);
        return c.json({ error: "Internal server error" }, 500);
      }
    });
  }
}
