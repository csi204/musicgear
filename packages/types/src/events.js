import { z } from "zod";

// Zod v4 .uuid() validate เฉพาะ RFC 4122 strict format
// ใช้ regex ที่ยืดหยุ่นกว่าเพื่อ interop กับ service อื่น
const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid UUID format"
  );


export const stockUpdatedEvent = z.object({
  event: z.literal("stock.updated"),
  productId: uuidSchema,
  beforeQty: z.number().int(),
  afterQty: z.number().int(),
});

export const orderStatusChangedEvent = z.object({
  event: z.literal("order.status_changed"),
  orderId: uuidSchema,
  customerId: uuidSchema,
  status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"]),
});

export const paymentSuccessEvent = z.object({
  event: z.literal("payment.success"),
  orderId: uuidSchema,
  customerId: uuidSchema,
  amount: z.number(),
  items: z.array(
    z.object({
      productId: uuidSchema,
      productName: z.string(),
      category: z.string(),
      quantitySold: z.number().int().positive(),
      revenue: z.number(),
    })
  ),
});

// addressCreatedEvent and addressUpdatedEvent are defined below with full fields (from Khet)

// subscriber ทั้งสองตัวที่ต้องฟัง event ชุดนี้ (QStash Topic fan-out)
export const QSTASH_SUBSCRIBERS = {
  notificationSvc: "/webhooks/qstash", // services/notification-svc
  reportSvc: "/webhooks/qstash",       // services/report-svc — เขตเขียนทีหลังได้ ไม่ block ใคร
};

// ---------------------------------------------------------------------------
// Inventory Request Schemas (ใช้ใน inventory-svc เท่านั้น)
// ---------------------------------------------------------------------------

const stockItemSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().positive(),
});

/** POST /stock/check */
export const checkStockSchema = z.object({
  items: z.array(stockItemSchema).min(1),
});

/** POST /stock/reserve */
export const reserveStockSchema = z.object({
  orderId: uuidSchema,
  items: z.array(stockItemSchema).min(1),
});

/** POST /stock/release */
export const releaseStockSchema = z.object({
  orderId: uuidSchema,
});

/** POST /stock/sale-deduct */
export const saleDeductSchema = z.object({
  orderId: uuidSchema,
});

/**
 * POST /stock/adjust — Staff/Admin ปรับสต็อกด้วยมือ
 *
 * action: "receive" (รับของเข้า) | "adjust" (แก้ไขค่าผิดพลาด)
 * เฉพาะ receive และ adjust เท่านั้น — reserve/release/sale_deduct ไม่ใช้ endpoint นี้
 */
export const adjustStockSchema = z.object({
  productId: uuidSchema,
  changeQty: z.number().int().refine((v) => v !== 0, "changeQty must not be 0"),
  action: z.enum(["receive", "adjust"]),
  staffId: uuidSchema.optional(),
});

export const productCreatedEvent = z.object({
  event: z.literal("product.created"),
  productId: uuidSchema,
});

export const addressCreatedEvent = z.object({
  event: z.literal("address.created"),
  addressId: uuidSchema,
  customerId: z.string(),
  receiverName: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable().optional(),
  province: z.string(),
  city: z.string(),
  postalCode: z.string(),
});

export const addressUpdatedEvent = z.object({
  event: z.literal("address.updated"),
  addressId: uuidSchema,
  customerId: z.string(),
  receiverName: z.string(),
  phone: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable().optional(),
  province: z.string(),
  city: z.string(),
  postalCode: z.string(),
});

// ---------------------------------------------------------------------------
// QStash Webhook Payload (ใช้ใน notification-svc และ inventory-svc)
// รวม 6 event types: 2 จากบุญ + 2 จากเดียร์ + 2 จากเขต (discriminated union)
// ---------------------------------------------------------------------------
export const qstashWebhookSchema = z.discriminatedUnion("event", [
  orderStatusChangedEvent,
  paymentSuccessEvent,
  stockUpdatedEvent,
  addressCreatedEvent,
  addressUpdatedEvent,
  productCreatedEvent,
]);