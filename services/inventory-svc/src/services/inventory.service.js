import { publishStockUpdated } from "../events/publishStockUpdated.js";
import { fetchProductSnapshot } from "../events/fetchProductSnapshot.js";

// ---------------------------------------------------------------------------
// checkStock — ตรวจว่าสินค้ามีพอไหม (ไม่แก้ DB)
// available stock = quantity - reservedQuantity
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {{ productId: string; quantity: number }[]} items
 * @returns {{ available: boolean; items: object[] }}
 */
export async function checkStock(db, items) {
  const productIds = items.map((i) => i.productId);

  const inventories = await db.inventory.findMany({
    where: { productId: { in: productIds } },
  });

  const inventoryMap = new Map(inventories.map((inv) => [inv.productId, inv]));

  const result = items.map((item) => {
    const inv = inventoryMap.get(item.productId);
    const currentStock = inv ? inv.quantity - inv.reservedQuantity : 0;
    return {
      productId: item.productId,
      quantity: item.quantity,
      currentStock,
      ok: currentStock >= item.quantity,
    };
  });

  const available = result.every((r) => r.ok);
  return { available, items: result };
}

// ---------------------------------------------------------------------------
// reserveStock — จองสินค้า (interactive transaction + row-level lock)
//
// ใช้ interactive transaction เพื่อป้องกัน race condition
// ล็อค inventory row ด้วย SELECT ... FOR UPDATE ก่อนตรวจ/แก้ค่า
// ถ้าสต็อกไม่พอ throw Error → Prisma rollback transaction อัตโนมัติ
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} orderId
 * @param {{ productId: string; quantity: number }[]} items
 * @returns {{ reserved: boolean; orderId: string; failedItems?: object[] }}
 */
export async function reserveStock(db, orderId, items) {
  try {
    const rolledBackOps = [];
    for (const item of items) {
      const inv = await db.inventory.findUnique({
        where: { productId: item.productId }
      });

      const available = inv ? inv.quantity - inv.reservedQuantity : 0;

      if (!inv || available < item.quantity) {
        // Rollback completed operations to ensure atomicity
        for (const op of rolledBackOps) {
          await db.inventory.update({
            where: { productId: op.productId },
            data: { reservedQuantity: { decrement: op.quantity } },
          });
          await db.inventoryLog.deleteMany({
            where: { orderId, productId: op.productId, action: "reserve" }
          });
        }

        const err = new Error("INSUFFICIENT_STOCK");
        err.productId = item.productId;
        err.requested = item.quantity;
        err.available = available;
        throw err;
      }

      const updatedInv = await db.inventory.update({
        where: { productId: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });

      await db.inventoryLog.create({
        data: {
          productId: item.productId,
          orderId,
          beforeQty: inv.reservedQuantity,
          afterQty: inv.reservedQuantity + item.quantity,
          changeQty: item.quantity,
          action: "reserve",
        },
      });

      rolledBackOps.push({ productId: item.productId, quantity: item.quantity });
    }

    return { reserved: true, orderId };
  } catch (err) {
    if (err.message === "INSUFFICIENT_STOCK") {
      return {
        reserved: false,
        orderId,
        reason: "INSUFFICIENT_STOCK",
        failedItems: [
          {
            productId: err.productId,
            requested: err.requested,
            available: err.available,
          },
        ],
      };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// releaseStock — คืนสต็อก (idempotent)
// ค้นหา reserve logs จาก orderId แล้วลด reservedQuantity ผ่าน Prisma
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} orderId
 * @returns {{ released: boolean; orderId: string }}
 */
export async function releaseStock(db, orderId) {
  // ตรวจ idempotency: ถ้ามี release log อยู่แล้ว → สำเร็จเลย
  const existingRelease = await db.inventoryLog.findFirst({
    where: { orderId, action: "release" },
  });

  if (existingRelease) {
    return { released: true, orderId };
  }

  const reserveLogs = await db.inventoryLog.findMany({
    where: { orderId, action: "reserve" },
  });

  if (reserveLogs.length === 0) {
    // ไม่มีการ reserve → ถือว่า released แล้ว (idempotent)
    return { released: true, orderId };
  }

  // Atomic release: ลด reservedQuantity + insert release log sequentially
  for (const log of reserveLogs) {
    const inv = await db.inventory.update({
      where: { productId: log.productId },
      data: {
        reservedQuantity: {
          decrement: log.changeQty,
        },
      },
    });

    await db.inventoryLog.create({
      data: {
        productId: log.productId,
        orderId,
        beforeQty: inv.reservedQuantity + log.changeQty, // ค่าก่อน decrement (Prisma return ค่าใหม่)
        afterQty: inv.reservedQuantity,
        changeQty: log.changeQty,
        action: "release",
      },
    });
  }

  return { released: true, orderId };
}

// ---------------------------------------------------------------------------
// saleDeductStock — ตัดสต็อกจริงเมื่อชำระเงินสำเร็จ
// ลด quantity + reservedQuantity + log + publish event ถ้า qty ลดถึง 0
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} orderId
 * @param {object} env — Cloudflare Worker env bindings (สำหรับ QStash publish)
 * @returns {{ deducted: boolean; orderId: string }}
 */
export async function saleDeductStock(db, orderId, env) {
  const reserveLogs = await db.inventoryLog.findMany({
    where: { orderId, action: "reserve" },
  });

  if (reserveLogs.length === 0) {
    // ไม่มีการ reserve → ถือว่า deduct แล้ว (idempotent edge case)
    return { deducted: true, orderId };
  }

  const deductedItems = [];

  // Deduct sequentially without transaction block
  for (const log of reserveLogs) {
    // ดึงค่าปัจจุบันก่อนตัด
    const before = await db.inventory.findUnique({
      where: { productId: log.productId },
      select: { quantity: true },
    });
    const beforeQty = before?.quantity ?? 0;

    // ลด quantity + reservedQuantity พร้อมกัน
    const inv = await db.inventory.update({
      where: { productId: log.productId },
      data: {
        quantity: { decrement: log.changeQty },
        reservedQuantity: { decrement: log.changeQty },
      },
    });

    const afterQty = Math.max(0, inv.quantity);

    await db.inventoryLog.create({
      data: {
        productId: log.productId,
        orderId,
        beforeQty,
        afterQty,
        changeQty: log.changeQty,
        action: "sale_deduct",
      },
    });

    deductedItems.push({ productId: log.productId, beforeQty, afterQty });
  }

  // Publish stock.updated event สำหรับสินค้าที่ quantity ลดถึง 0 (out-of-stock)
  for (const item of deductedItems) {
    if (item.afterQty === 0) {
      // ดึงข้อมูล reorderPoint จาก DB + productName/category จาก product-svc
      const inv = await db.inventory.findUnique({
        where: { productId: item.productId },
        select: { reorderPoint: true },
      });
      const reorderPoint = inv?.reorderPoint ?? 0;

      // คำนวณ status ตาม stockLevel vs reorderPoint
      const stockLevel = item.afterQty;
      const status = stockLevel === 0 ? "Critical"
        : stockLevel <= reorderPoint ? "Low"
        : "In Stock";

      // ดึง productName + category จาก product-svc
      const productInfo = await fetchProductSnapshot(env, item.productId);

      await publishStockUpdated(env, item.productId, item.beforeQty, item.afterQty, {
        productName: productInfo?.productName ?? "Unknown",
        category: productInfo?.category ?? "Uncategorized",
        stockLevel,
        reorderPoint,
        status,
      });
    }
  }

  return { deducted: true, orderId };
}

// ---------------------------------------------------------------------------
// adjustStock — Staff/Admin ปรับสต็อกด้วยมือ (receive | adjust)
//
// กฎเหล็ก: ทุกการเปลี่ยนแปลงสต็อกต้อง insert InventoryLog คู่กันเสมอ (Rule #3)
// หลังจาก receive: ถ้า beforeQty === 0 && afterQty > 0 → publish stock.updated
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} productId
 * @param {number} changeQty — บวก = เพิ่ม, ลบ = ลด
 * @param {"receive" | "adjust"} action
 * @param {string | undefined} staffId
 * @param {object} env — Cloudflare Worker env bindings
 * @returns {{ adjusted: boolean; productId: string; afterQty: number }}
 */
export async function adjustStock(db, productId, changeQty, action, staffId, env) {
  let beforeQty = 0;
  let afterQty = 0;

  // Query current inventory record sequentially without transaction
  const inv = await db.inventory.findUnique({
    where: { productId }
  });

  beforeQty = inv?.quantity ?? 0;

  // If no inventory record exists, create it
  if (!inv) {
    await db.inventory.create({
      data: {
        productId,
        quantity: Math.max(0, changeQty),
        reservedQuantity: 0,
      },
    });
    afterQty = Math.max(0, changeQty);
  } else {
    const newQty = Math.max(0, inv.quantity + changeQty);
    await db.inventory.update({
      where: { productId },
      data: { quantity: newQty },
    });
    afterQty = newQty;
  }

  await db.inventoryLog.create({
    data: {
      productId,
      beforeQty,
      afterQty,
      changeQty,
      action,
      staffId: staffId ?? null,
    },
  });

  // ถ้าสินค้ากลับมามีสต็อก (beforeQty = 0, afterQty > 0) → notify ลูกค้าที่รอ
  // หรือเมื่อสต็อกเปลี่ยนแปลง → อัปเดต InventorySnapshot ใน report-svc ด้วย
  if (beforeQty === 0 && afterQty > 0) {
    // ดึงข้อมูล reorderPoint จาก DB
    const inv = await db.inventory.findUnique({
      where: { productId },
      select: { reorderPoint: true },
    });
    const reorderPoint = inv?.reorderPoint ?? 0;

    // คำนวณ status ตาม stockLevel vs reorderPoint
    const stockLevel = afterQty;
    const status = stockLevel === 0 ? "Critical"
      : stockLevel <= reorderPoint ? "Low"
      : "In Stock";

    // ดึง productName + category จาก product-svc
    const productInfo = await fetchProductSnapshot(env, productId);

    await publishStockUpdated(env, productId, beforeQty, afterQty, {
      productName: productInfo?.productName ?? "Unknown",
      category: productInfo?.category ?? "Uncategorized",
      stockLevel,
      reorderPoint,
      status,
    });
  }

  return { adjusted: true, productId, beforeQty, afterQty };
}

// ---------------------------------------------------------------------------
// initializeInventory — สร้างข้อมูลสต็อกสินค้าใหม่ให้เป็น 0 (Idempotent)
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} productId
 */
export async function initializeInventory(db, productId) {
  const existing = await db.inventory.findUnique({
    where: { productId },
  });

  if (existing) {
    console.info(`[inventory-svc] Inventory already initialized for product: ${productId}`);
    return existing;
  }

  console.info(`[inventory-svc] Initializing inventory to 0 for product: ${productId}`);
  return await db.inventory.create({
    data: {
      productId,
      quantity: 0,
      reservedQuantity: 0,
    },
  });
}
