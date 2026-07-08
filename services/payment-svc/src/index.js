import { Hono } from 'hono'
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { createPrisma } from "./db/prisma.js";
import { z } from "zod";

const app = new Hono()
const authMiddleware = createAuthMiddleware("https://musicgear.kinde.com");
const requireAdmin = createRoleMiddleware(["admin"]);

app.get('/', (c) => c.json({ status: 'ok', service: 'payment' }))

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

// Helper to publish payment success to QStash (with direct HTTP fallback for local testing)
async function publishPaymentSuccess(c, payload) {
  const env = c.env;
  const qstashUrl = env.QSTASH_URL;
  const qstashToken = env.QSTASH_TOKEN;

  const subscribers = [
    `${env.NOTIFICATION_SVC_URL || "http://localhost:8791"}/webhooks/qstash`,
    `${env.REPORT_SVC_URL || "http://localhost:8795"}/webhooks/qstash`,
    `${env.ORDER_SVC_URL || "http://localhost:8792"}/webhooks/qstash`,
  ];

  if (!qstashUrl || !qstashToken) {
    console.warn("[payment-svc] QStash not configured — falling back to direct HTTP requests");
    for (const url of subscribers) {
      try {
        console.info(`[payment-svc] Direct webhook dispatching success event to: ${url}`);
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.error(`[payment-svc] Failed to dispatch webhook to ${url}:`, err.message);
      }
    }
    return;
  }

  // Publish to QStash subscribers
  for (const url of subscribers) {
    try {
      console.info(`[payment-svc] Publishing success event to QStash for subscriber: ${url}`);
      const res = await fetch(`${qstashUrl}/v2/publish/${url}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[payment-svc] QStash failed to publish to ${url}: ${res.status} ${text}`);
      }
    } catch (err) {
      console.error(`[payment-svc] QStash publish error to ${url}:`, err.message);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /payments — Process Payment (Credit Card via Omise)
// ──────────────────────────────────────────────────────────────────────────────
app.post("/payments", authMiddleware, async (c) => {
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

  const { orderId, paymentMethod, token } = result.data;

  // 1. Fetch Order Details from ORDER_SVC
  let order;
  try {
    const orderRes = await c.env.ORDER_SVC.fetch(`http://order-svc/orders/${orderId}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!orderRes.ok) {
      if (orderRes.status === 404) {
        return c.json({ error: { code: "ORDER_NOT_FOUND", message: "ไม่พบคำสั่งซื้อที่อ้างอิง" } }, 404);
      }
      return c.json({ error: { code: "ORDER_SVC_ERROR", message: "ล้มเหลวในการดึงข้อมูลคำสั่งซื้อ" } }, 500);
    }

    order = await orderRes.json();
  } catch (err) {
    console.error("[payment-svc] Order fetch error:", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500);
  }

  // 2. Validate Order Status
  if (order.status !== "pending") {
    return c.json({ error: { code: "INVALID_ORDER_STATUS", message: "คำสั่งซื้อได้รับการชำระเงินหรือยกเลิกไปแล้ว" } }, 400);
  }

  const amountInThb = Number(order.grandTotal);
  const amountInSatang = Math.round(amountInThb * 100);

  // 3. Call Omise API to charge
  const omiseSecretKey = c.env.OMISE_SECRET_KEY || "mock";
  let charge;

  try {
    if (omiseSecretKey === "mock" || token === "mock-payment") {
      // Mock successful transaction
      charge = {
        id: `chg_mock_${crypto.randomUUID().substring(0, 8)}`,
        status: "successful",
        amount: amountInSatang,
        currency: "thb",
      };
    } else {
      const auth = "Basic " + btoa(omiseSecretKey + ":");
      const omiseRes = await fetch("https://api.omise.co/charges", {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInSatang,
          currency: "thb",
          card: token,
        }),
      });

      if (!omiseRes.ok) {
        const errorText = await omiseRes.text();
        console.error("[payment-svc] Omise charge error:", errorText);
        
        // Save failed payment record
        await prisma.payment.create({
          data: {
            orderId,
            paymentMethod,
            amount: amountInThb,
            status: "failed",
          },
        });

        return c.json({ error: { code: "PAYMENT_FAILED", message: "การชำระเงินไม่ผ่านกรุณาตรวจสอบวงเงินหรือบัตรเครดิต" } }, 402);
      }

      charge = await omiseRes.json();
    }
  } catch (chargeErr) {
    console.error("[payment-svc] Card charging runtime error:", chargeErr);
    return c.json({ error: { code: "PAYMENT_RUNTIME_ERROR", message: "เกิดข้อผิดพลาดขณะส่งยอดชำระ" } }, 500);
  }

  const isSuccess = charge.status === "successful";

  // 4. Save Payment Record to Neon DB
  let payment;
  try {
    payment = await prisma.payment.create({
      data: {
        orderId,
        paymentMethod,
        amount: amountInThb,
        status: isSuccess ? "paid" : "failed",
        transactionRef: charge.id,
        paidAt: isSuccess ? new Date() : null,
      },
    });
  } catch (dbErr) {
    console.error("[payment-svc] Database write failed:", dbErr);
    return c.json({ error: { code: "DATABASE_WRITE_FAILED", message: "บันทึกข้อมูลการชำระเงินล้มเหลว" } }, 500);
  }

  if (!isSuccess) {
    return c.json({ error: { code: "PAYMENT_FAILED", message: "การชำระเงินไม่สำเร็จ" } }, 402);
  }

  // 5. Build items details for payment.success event (fetching name/category from PRODUCT_SVC)
  const successItems = [];
  for (const item of order.items) {
    let productName = "Unknown Product";
    let category = "Unknown Category";
    try {
      const prodRes = await c.env.PRODUCT_SVC.fetch(`http://product-svc/products/${item.productId}`);
      if (prodRes.ok) {
        const product = await prodRes.json();
        productName = product.name || productName;
        category = product.category?.name || category;
      }
    } catch (err) {
      console.warn(`[payment-svc] Failed to fetch product details for ${item.productId}:`, err.message);
    }

    successItems.push({
      productId: item.productId,
      productName,
      category,
      quantitySold: item.quantity,
      revenue: Number(item.unitPrice) * item.quantity,
    });
  }

  // 6. Publish payment.success event to QStash
  const payload = {
    event: "payment.success",
    orderId: order.orderId,
    customerId: order.customerId,
    amount: amountInThb,
    items: successItems,
  };

  // Run async without blocking response
  c.executionCtx.waitUntil(publishPaymentSuccess(c, payload));

  return c.json({
    success: true,
    paymentId: payment.paymentId,
    orderId: payment.orderId,
    status: payment.status,
    transactionRef: payment.transactionRef,
  }, 201);
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /payments/:paymentId/refund — Refund Payment (Admin Only)
// ──────────────────────────────────────────────────────────────────────────────
app.post("/payments/:paymentId/refund", authMiddleware, requireAdmin, async (c) => {
  const prisma = getPrisma(c);
  const paymentId = c.req.param("paymentId");

  // 1. Find payment record
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
  });

  if (!payment) {
    return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบรายการชำระเงินที่ต้องการคืนเงิน" } }, 404);
  }

  if (payment.status !== "paid") {
    return c.json({ error: { code: "BAD_REQUEST", message: "รายการชำระเงินไม่ได้อยู่ในสถานะสำเร็จ ไม่สามารถทำเรื่องคืนเงินได้" } }, 400);
  }

  const omiseSecretKey = c.env.OMISE_SECRET_KEY || "mock";
  
  try {
    if (omiseSecretKey !== "mock" && payment.transactionRef && !payment.transactionRef.startsWith("chg_mock_")) {
      // Call Omise API to refund
      const auth = "Basic " + btoa(omiseSecretKey + ":");
      const refundRes = await fetch(`https://api.omise.co/charges/${payment.transactionRef}/refunds`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(Number(payment.amount) * 100),
        }),
      });

      if (!refundRes.ok) {
        const errorText = await refundRes.text();
        console.error("[payment-svc] Omise refund error:", errorText);
        return c.json({ error: { code: "REFUND_FAILED", message: "การคืนเงินผ่านระบบผู้ให้บริการล้มเหลว" } }, 402);
      }
    }

    // 2. Update status in Postgres
    const updatedPayment = await prisma.payment.update({
      where: { paymentId },
      data: {
        status: "refunded",
      },
    });

    return c.json({
      success: true,
      paymentId: updatedPayment.paymentId,
      status: updatedPayment.status,
    }, 200);

  } catch (err) {
    console.error("[payment-svc] Refund processing failed:", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดในการดำเนินเรื่องคืนเงิน" } }, 500);
  }
});

export default app
