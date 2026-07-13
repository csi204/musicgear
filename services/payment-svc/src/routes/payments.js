import { Hono } from "hono";
import { PaymentService } from "../services/payment.service.js";
import { createPrisma } from "../db/prisma.js";
import { z } from "zod";
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";

const router = new Hono();
const authMiddleware = createAuthMiddleware();
const requireAdmin = createRoleMiddleware(["admin"]);

// Helper: Get Prisma Client
function getPrisma(c) {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  return createPrisma(databaseUrl);
}

// Zod Validation Schema for Payments
const paymentCreateSchema = z.object({
  orderId: z.string().uuid("orderId must be a valid UUID"),
  paymentMethod: z.enum(["credit_card", "promptpay", "bank_transfer"]),
  token: z.string().min(1, "Payment token/source is required"),
});

// 1. Process Payment
router.post("/", authMiddleware, async (c) => {
  const authHeader = c.req.header("Authorization") || "";
  const prisma = getPrisma(c);

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400);
  }

  const result = paymentCreateSchema.safeParse(body);
  if (!result.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          issues: result.error.flatten(),
        },
      },
      400
    );
  }

  try {
    const payment = await PaymentService.processPayment(
      prisma,
      c.env,
      result.data,
      authHeader,
      c.executionCtx
    );

    return c.json({
      success: true,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status,
      transactionRef: payment.transactionRef,
    }, 201);

  } catch (err) {
    console.error("[payment-svc] Process payment error:", err.message);

    if (err.message === "ORDER_NOT_FOUND") {
      return c.json({ error: { code: "ORDER_NOT_FOUND", message: "ไม่พบคำสั่งซื้อที่อ้างอิง" } }, 404);
    }
    if (err.message === "ORDER_SVC_ERROR") {
      return c.json({ error: { code: "ORDER_SVC_ERROR", message: "ล้มเหลวในการดึงข้อมูลคำสั่งซื้อ" } }, 500);
    }
    if (err.message === "INVALID_ORDER_STATUS") {
      return c.json({ error: { code: "INVALID_ORDER_STATUS", message: "คำสั่งซื้อได้รับการชำระเงินหรือยกเลิกไปแล้ว" } }, 400);
    }
    if (err.message === "PAYMENT_FAILED") {
      return c.json({ error: { code: "PAYMENT_FAILED", message: "การชำระเงินไม่ผ่านกรุณาตรวจสอบวงเงินหรือบัตรเครดิต" } }, 402);
    }
    if (err.message === "DATABASE_WRITE_FAILED") {
      return c.json({ error: { code: "DATABASE_WRITE_FAILED", message: "บันทึกข้อมูลการชำระเงินล้มเหลว" } }, 500);
    }

    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500);
  }
});

// 2. Get Payment by Order ID (for order detail page to check payment status)
router.get("/by-order/:orderId", authMiddleware, async (c) => {
  const prisma = getPrisma(c);
  const orderId = c.req.param("orderId");

  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      select: {
        paymentId: true,
        orderId: true,
        status: true,
        paymentMethod: true,
        amount: true,
        paidAt: true,
      },
    });

    if (!payment) {
      return c.json({ payment: null }, 200);
    }

    return c.json({ payment }, 200);
  } catch (err) {
    console.error("[payment-svc] Get payment by order error:", err.message);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500);
  }
});

// 3. Refund Payment (Admin Only)
router.post("/:paymentId/refund", authMiddleware, requireAdmin, async (c) => {
  const prisma = getPrisma(c);
  const paymentId = c.req.param("paymentId");

  try {
    const updatedPayment = await PaymentService.refundPayment(prisma, c.env, paymentId);
    return c.json({
      success: true,
      paymentId: updatedPayment.paymentId,
      status: updatedPayment.status,
    }, 200);

  } catch (err) {
    console.error("[payment-svc] Refund payment error:", err.message);

    if (err.message === "PAYMENT_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบรายการชำระเงินที่ต้องการคืนเงิน" } }, 404);
    }
    if (err.message === "INVALID_PAYMENT_STATUS") {
      return c.json({ error: { code: "BAD_REQUEST", message: "รายการชำระเงินไม่ได้อยู่ในสถานะสำเร็จ ไม่สามารถทำเรื่องคืนเงินได้" } }, 400);
    }
    if (err.message === "REFUND_FAILED" || err.message === "REFUND_API_FAILED") {
      return c.json({ error: { code: "REFUND_FAILED", message: "การคืนเงินผ่านระบบผู้ให้บริการล้มเหลว" } }, 402);
    }

    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500);
  }
});

export default router;
