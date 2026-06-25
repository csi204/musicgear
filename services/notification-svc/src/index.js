import { Hono } from "hono";
import { webhookRoutes } from "./routes/webhooks.js";

const app = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "notification-svc" }));

// ──────────────────────────────────────────────────────────────────────────────
// Routes
//
// /webhooks/* — ไม่มี verifyKindeToken เพราะเป็น QStash subscriber
//   QStash ยิงมาด้วย Signing Key ของตัวเอง (ถ้า production ใช้ QSTASH_CURRENT_SIGNING_KEY)
// ──────────────────────────────────────────────────────────────────────────────
app.route("/webhooks", webhookRoutes);

export default app;
