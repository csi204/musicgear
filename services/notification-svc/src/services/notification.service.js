// ---------------------------------------------------------------------------
// notification.service.js — Business logic สำหรับบันทึก Staff Alert
// ──────────────────────────────────────────────────────────────────────────────
// ทุก event ที่รับผ่าน /webhooks/qstash จะถูก insert ลงตาราง Notification
// โดยตั้ง isStaffAlert = true เพื่อให้ Staff Portal query และแสดงผลได้ทันที
// ---------------------------------------------------------------------------

/**
 * จัดการ event `order.status_changed`
 * บันทึก notification เพื่อให้ Staff รับรู้ว่า order เปลี่ยนสถานะ
 *
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {{ orderId: string; customerId: string; status: string }} payload
 */
export async function handleOrderStatusChanged(db, payload) {
  const { orderId, customerId, status } = payload;

  const statusLabels = {
    pending:   "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    packed:    "แพ็คสินค้าแล้ว",
    shipped:   "จัดส่งแล้ว",
    delivered: "ส่งถึงมือลูกค้า",
    cancelled: "ยกเลิกแล้ว",
    refunded:  "คืนเงินแล้ว",
  };

  const label = statusLabels[status] ?? status;

  await db.notification.create({
    data: {
      customerId,
      orderId,
      title: `Order ${status.toUpperCase()}`,
      message: `Order #${orderId.slice(0, 8)} สถานะเปลี่ยนเป็น "${label}"`,
      type: "order_update",
      status: "sent",
      isStaffAlert: true,
      isRead: false,
    },
  });
}

/**
 * จัดการ event `payment.success`
 * บันทึก notification เพื่อให้ Staff รับรู้ว่ามีออเดอร์ใหม่ชำระเงินแล้ว
 *
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {{ orderId: string; customerId: string }} payload
 */
export async function handlePaymentSuccess(db, payload) {
  const { orderId, customerId } = payload;

  await db.notification.create({
    data: {
      customerId,
      orderId,
      title: "Payment Received",
      message: `Order #${orderId.slice(0, 8)} ชำระเงินสำเร็จแล้ว — รอการยืนยันและจัดส่ง`,
      type: "order_update",
      status: "sent",
      isStaffAlert: true,
      isRead: false,
    },
  });
}

/**
 * จัดการ event `stock.updated`
 * บันทึก notification ประเภท back_in_stock เพื่อให้ Staff Portal แจ้งเตือนลูกค้าที่รอสินค้า
 *
 * ยิงมาจาก inventory-svc → publishStockUpdated() เมื่อ afterQty > 0 (หลังจากหมดสต็อก)
 *
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {{ productId: string; beforeQty: number; afterQty: number }} payload
 */
export async function handleStockUpdated(db, payload) {
  const { productId, beforeQty, afterQty } = payload;

  // Guard: publish เฉพาะตอนที่สินค้ากลับมามีสต็อก (0 → มีของ)
  // inventory-svc ควรส่งมาแค่ตอนนี้แล้ว แต่ double-check ไว้ปลอดภัย
  if (beforeQty !== 0 || afterQty <= 0) {
    console.warn(`[handleStockUpdated] unexpected: beforeQty=${beforeQty} afterQty=${afterQty}, skipping`);
    return;
  }

  // customerId เป็น null ในกรณี back_in_stock เพราะ notification นี้สำหรับ Staff ดู
  // (ถ้าในอนาคตอยากแจ้งลูกค้าที่ wishlist ไว้ ต้องเพิ่ม logic ดึง wishlist แยก)
  await db.notification.create({
    data: {
      // customerId required — ใช้ placeholder UUID (system notification)
      // TODO: ถ้ามี wishlist feature ในอนาคต ส่ง customerId จาก wishlist แทน
      customerId: "00000000-0000-0000-0000-000000000000",
      productId,
      title: "Back In Stock",
      message: `สินค้า #${productId.slice(0, 8)} กลับมามีสต็อกแล้ว (ก่อนหน้า: ${beforeQty} → ปัจจุบัน: ${afterQty} ชิ้น)`,
      type: "back_in_stock",
      status: "sent",
      isStaffAlert: true,
      isRead: false,
    },
  });
}

