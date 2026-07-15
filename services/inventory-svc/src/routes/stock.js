import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
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

export const stockRoutes = new Hono(); // Touched to trigger hot-reload after capacityPct update

// ──────────────────────────────────────────────────────────────────────────────
// GET /stock/sync-db — [TEMPORARY] ดึงสินค้าจาก product-svc มาใส่ตาราง inventory
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.get("/sync-db", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const res = await fetch("http://localhost:8794/api/products");
    const data = await res.json();
    const products = data.products || data || [];
    let count = 0;
    for (const p of products) {
      const existing = await db.inventory.findUnique({ where: { productId: p.id } });
      if (!existing) {
        await db.inventory.create({
          data: { productId: p.id, quantity: 0, reservedQuantity: 0, reorderPoint: 5 }
        });
        count++;
      }
    }
    return c.json({ status: "ok", message: `Synced ${count} products to Inventory DB.` }, 200);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

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
// GET /stock/summary — ดึงข้อมูลสรุปสถานะสินค้าในคลังสำหรับ Dashboard
// ──────────────────────────────────────────────────────────────────────────────
stockRoutes.get("/summary", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const inventories = await db.inventory.findMany();
    
    // Fetch products to map status (e.g. discontinued)
    const productMap = new Map();
    try {
      const productSvcUrl = c.env.PRODUCT_SVC_URL ?? "http://localhost:8794";
      const res = await fetch(`${productSvcUrl.replace(/\/$/, "")}/products?status=all&limit=1000`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        const products = data.products || [];
        products.forEach(p => {
          productMap.set(p.productId, p);
        });
      }
    } catch (err) {
      console.error("[GET /stock/summary] Failed to fetch product list for status mapping:", err.message);
    }

    const validInventories = inventories.filter(i => productMap.has(i.productId));
    const totalStock = validInventories.length;

    const computed = validInventories.map(i => {
      const avail = i.quantity - i.reservedQuantity;
      const product = productMap.get(i.productId);
      const isDiscontinued = product?.status === "discontinued";
      // ถ้าสินค้าเป็น discontinued และไม่มีสต็อกพร้อมขาย ไม่ต้องมองเป็น Critical/Low ให้ถือว่าปกติ (In Stock)
      const threshold = i.reorderPoint > 0 ? i.reorderPoint : Math.round(0.3 * i.maxCapacity);
      const status = (isDiscontinued && avail <= 0)
        ? "In Stock"
        : (avail <= 0 ? "Critical" : avail <= threshold ? "Low" : "In Stock");
      return { 
        ...i, 
        computedStatus: status,
        available: avail,
        productName: product?.name ?? "สินค้า",
        categoryName: product?.category?.name ?? "ทั่วไป"
      };
    });

    const ok = computed.filter(i => i.computedStatus === "In Stock").length;
    const low = computed.filter(i => i.computedStatus === "Low").length;
    const critical = computed.filter(i => i.computedStatus === "Critical").length;

    const okPct = totalStock > 0 ? Math.round((ok / totalStock) * 100) : 100;
    const lowPct = totalStock > 0 ? Math.round((low / totalStock) * 100) : 0;
    const critPct = totalStock > 0 ? (100 - okPct - lowPct) : 0;

    const totalQty = validInventories.reduce((sum, i) => sum + i.quantity, 0);
    const totalMaxCap = validInventories.reduce((sum, i) => sum + i.maxCapacity, 0);
    const capacityPct = totalMaxCap > 0 ? Math.round((totalQty / totalMaxCap) * 100) : 0;
    const occupied = validInventories.filter(i => i.quantity > 0).length;

    const allLowItems = computed.filter(i => i.computedStatus === "Low" || i.computedStatus === "Critical");
    
    return c.json({
      status: "ok",
      totalStock,
      occupiedStock: occupied,
      capacityPct,
      okPct,
      lowPct,
      critPct: Math.max(0, critPct),
      totalAlertsCount: allLowItems.length,
      alerts: allLowItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        categoryName: item.categoryName,
        quantity: item.quantity,
        reservedQuantity: item.reservedQuantity,
        available: item.available,
        reorderPoint: item.reorderPoint,
        maxCapacity: item.maxCapacity,
        computedStatus: item.computedStatus
      }))
    }, 200);
  } catch (err) {
    console.error("[GET /stock/summary]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message } }, 500);
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
    const threshold = inv.reorderPoint > 0 ? inv.reorderPoint : Math.round(0.3 * inv.maxCapacity);
    const status = available <= 0 ? "Critical"
      : available <= threshold ? "Low"
      : "In Stock";

    return c.json({
      productId: inv.productId,
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      available,
      reorderPoint: inv.reorderPoint,
      maxCapacity: inv.maxCapacity,
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
          { staffId: user?.userId || user?.sub || null },
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

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /stock/:productId/max-capacity — Staff/Admin ตั้งค่าความจุสูงสุด
// ──────────────────────────────────────────────────────────────────────────────
const setMaxCapacitySchema = z.object({
  maxCapacity: z.number().int().min(1),
});

stockRoutes.patch(
  "/:productId/max-capacity",
  createRoleMiddleware(["staff", "admin"]),
  async (c) => {
    const productId = c.req.param("productId");
    let body;

    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400);
    }

    const parsed = setMaxCapacitySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } }, 400);
    }

    const { maxCapacity } = parsed.data;
    const db = createClient(c.env.DATABASE_URL);

    try {
      const inv = await db.inventory.update({
        where: { productId },
        data: { maxCapacity },
      });

      return c.json({
        productId: inv.productId,
        maxCapacity: inv.maxCapacity,
        message: "Maximum capacity updated successfully",
      }, 200);
    } catch (err) {
      if (err?.code === "P2025") {
        return c.json({ error: { code: "NOT_FOUND", message: "Inventory record not found" } }, 404);
      }
      console.error("[PATCH /stock/:productId/max-capacity]", err);
      return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
    }
  }
);
