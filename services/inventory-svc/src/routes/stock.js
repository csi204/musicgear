import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  checkStockSchema,
  reserveStockSchema,
  releaseStockSchema,
  saleDeductSchema,
  adjustStockSchema,
} from "types/src/events.js";
import { createClient } from "../db/client.js";
import {
  checkStock,
  reserveStock,
  releaseStock,
  saleDeductStock,
  adjustStock,
} from "../services/inventory.service.js";
import { createRoleMiddleware } from "@musicgear/auth-middleware";

export const stockRoutes = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// POST /stock/check — ตรวจสต็อกก่อนซื้อ
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.post(
  "/check",
  zValidator("json", checkStockSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, 400);
    }
  }),
  async (c) => {
    const { items } = c.req.valid("json");
    const db = createClient(c.env.DATABASE_URL);

    try {
      const result = await checkStock(db, items);
      const status = result.available ? 200 : 409;
      return c.json(result, status);
    } catch (err) {
      console.error("[POST /stock/check]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /stock/reserve — จองสินค้าชั่วคราว (atomic transaction)
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.post(
  "/reserve",
  zValidator("json", reserveStockSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, 400);
    }
  }),
  async (c) => {
    const { orderId, items } = c.req.valid("json");
    const db = createClient(c.env.DATABASE_URL);

    try {
      const result = await reserveStock(db, orderId, items);
      const status = result.reserved ? 200 : 409;
      return c.json(result, status);
    } catch (err) {
      console.error("[POST /stock/reserve]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /stock/release — คืนสต็อกกรณียกเลิก/payment fail (idempotent)
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.post(
  "/release",
  zValidator("json", releaseStockSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, 400);
    }
  }),
  async (c) => {
    const { orderId } = c.req.valid("json");
    const db = createClient(c.env.DATABASE_URL);

    try {
      const result = await releaseStock(db, orderId);
      return c.json(result, 200);
    } catch (err) {
      console.error("[POST /stock/release]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /stock/sale-deduct — ตัดสต็อกจริงเมื่อชำระเงินสำเร็จ
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.post(
  "/sale-deduct",
  zValidator("json", saleDeductSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, 400);
    }
  }),
  async (c) => {
    const { orderId } = c.req.valid("json");
    const db = createClient(c.env.DATABASE_URL);

    try {
      const result = await saleDeductStock(db, orderId, c.env);
      return c.json(result, 200);
    } catch (err) {
      console.error("[POST /stock/sale-deduct]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// POST /stock/adjust — Staff/Admin ปรับสต็อกด้วยมือ (receive | adjust)
// ต้องมี role staff หรือ admin เท่านั้น (RBAC Guard — TODO: เขตเพิ่ม requireRole ตรงนี้)
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.post(
  "/adjust",
  createRoleMiddleware(["staff", "admin"]),
  zValidator("json", adjustStockSchema, (result, c) => {
    if (!result.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: result.error.message } }, 400);
    }
  }),
  async (c) => {
    const { productId, changeQty, action, staffId } = c.req.valid("json");
    const user = c.get("user");

    const roleKey = Array.isArray(user?.roles) ? user?.roles[0]?.key : null;
    const flatRole = user?.role;
    const rawRole = roleKey || flatRole || "customer";
    const role = String(rawRole).toLowerCase();

    // Staff is only allowed to perform "receive" action. "adjust" is restricted to Admin only.
    if (action === "adjust" && role !== "admin") {
      return c.json({ error: { code: "FORBIDDEN", message: "Only admin can adjust stock manually" } }, 403);
    }

    const db = createClient(c.env.DATABASE_URL);

    try {
      const result = await adjustStock(db, productId, changeQty, action, staffId, c.env);
      return c.json(result, 200);
    } catch (err) {
      console.error("[POST /stock/adjust]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// GET /stock — ดูสถานะสต็อกสินค้าทั้งหมด
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.get("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const inventories = await db.inventory.findMany();
    return c.json({ status: "ok", inventories }, 200);
  } catch (err) {
    console.error("[GET /stock]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /stock/:productId — ดูสถานะสต็อกปัจจุบัน (quantity, reorderPoint, status)
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.get("/:productId", async (c) => {
  const productId = c.req.param("productId");
  const db = createClient(c.env.DATABASE_URL);

  try {
    const inv = await db.inventory.findUnique({ where: { productId } });
    if (!inv) {
      return c.json({ error: { code: "NOT_FOUND", message: "Inventory record not found" } }, 404);
    }

    const available = inv.quantity - inv.reservedQuantity;
    const status = available === 0 ? "Critical"
      : available <= inv.reorderPoint ? "Low"
      : "In Stock";

    return c.json({
      productId: inv.productId,
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      available,
      reorderPoint: inv.reorderPoint,
      status,
    }, 200);
  } catch (err) {
    console.error("[GET /stock/:productId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /stock/:productId/logs — ดูประวัติการเคลื่อนไหวสต็อกสินค้าเฉพาะชิ้น
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.get(
  "/:productId/logs",
  createRoleMiddleware(["staff", "admin"]),
  async (c) => {
    const productId = c.req.param("productId");
    const user = c.get("user");

    const roleKey = Array.isArray(user?.roles) ? user?.roles[0]?.key : null;
    const flatRole = user?.role;
    const rawRole = roleKey || flatRole || "customer";
    const role = String(rawRole).toLowerCase();

    const db = createClient(c.env.DATABASE_URL);
    try {
      const whereClause = { productId };

      // If user is staff, only show their own logs or system logs (reserve, release, sale_deduct)
      if (role === "staff") {
        whereClause.OR = [
          { staffId: user?.sub || null },
          { staffId: null }
        ];
      }

      const logs = await db.inventoryLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return c.json({ status: "ok", logs }, 200);
    } catch (err) {
      console.error("[GET /stock/:productId/logs]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch stock logs" } }, 500);
    }
  }
);

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /stock/:productId/reorder-point — Staff/Admin ตั้งค่าจุด reorder
// เมื่อสต็อกลงถึง reorderPoint จะถูก mark เป็น "Low" → trigger แจ้งเตือน
// ──────────────────────────────────────────────────────────────────────────────
import { z } from "zod";

const setReorderPointSchema = z.object({
  reorderPoint: z.number().int().min(0),
});

stockRoutes.patch(
  "/:productId/reorder-point",
  createRoleMiddleware(["staff", "admin"]),
  async (c) => {
    const productId = c.req.param("productId");
    let body;

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400);
    }

    const parsed = setReorderPointSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, 400);
    }

    const { reorderPoint } = parsed.data;
    const db = createClient(c.env.DATABASE_URL);

    try {
      const inv = await db.inventory.update({
        where: { productId },
        data: { reorderPoint },
      });

      return c.json({
        productId: inv.productId,
        reorderPoint: inv.reorderPoint,
        message: "Reorder point updated successfully",
      }, 200);
    } catch (err) {
      // Prisma P2025 = record not found
      if (err?.code === "P2025") {
        return c.json({ error: { code: "NOT_FOUND", message: "Inventory record not found" } }, 404);
      }
      console.error("[PATCH /stock/:productId/reorder-point]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);
