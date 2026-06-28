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
