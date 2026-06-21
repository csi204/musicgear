import { z } from "zod";

export const stockUpdatedEvent = z.object({
  event: z.literal("stock.updated"),
  productId: z.string().uuid(),
  beforeQty: z.number().int(),
  afterQty: z.number().int(),
});

export const orderStatusChangedEvent = z.object({
  event: z.literal("order.status_changed"),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"]),
});

export const paymentSuccessEvent = z.object({
  event: z.literal("payment.success"),
  orderId: z.string().uuid(),
  customerId: z.string().uuid(),
});

// subscriber ทั้งสองตัวที่ต้องฟัง event ชุดนี้ (QStash Topic fan-out)
export const QSTASH_SUBSCRIBERS = {
  notificationSvc: "/webhooks/qstash", // services/notification-svc
  reportSvc: "/webhooks/qstash",       // services/report-svc — เขตเขียนทีหลังได้ ไม่ block ใคร
};