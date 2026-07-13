export class OrderService {
  static async getOrder(prisma, orderId) {
    return prisma.order.findUnique({
      where: { orderId },
      include: {
        items: true,
        shipment: true,
      },
    });
  }

  static async getOrders(prisma, customerId, { status, page = 1, limit = 20 } = {}) {
    const where = {};
    if (customerId) {
      where.customerId = customerId;
    }
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          shipment: true,
        },
        orderBy: { orderDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }

  static async updateOrderStatus(prisma, orderId, newStatus) {
    const order = await prisma.order.findUnique({
      where: { orderId },
    });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    // Validate status transition
    const currentStatus = order.status;
    const allowed = this.getAllowedTransitions(currentStatus);
    if (!allowed.includes(newStatus)) {
      throw new Error(`INVALID_STATUS_TRANSITION: Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: { status: newStatus },
      include: {
        items: true,
        shipment: true,
      },
    });

    return updatedOrder;
  }

  static getAllowedTransitions(currentStatus) {
    const VALID_TRANSITIONS = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    };
    return VALID_TRANSITIONS[currentStatus] || [];
  }

  /**
   * สร้างออเดอร์และทำระบบ Checkout Flow
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {object} env Cloudflare bindings
   * @param {string} customerId
   * @param {object} checkoutData
   * @param {string} authHeader JWT Auth header from requester
   */
  static async safeFetch(binding, fallbackUrl, path, options) {
    if (binding && typeof binding.fetch === "function") {
      try {
        const res = await binding.fetch(`http://service${path}`, options);
        if (res.status !== 503) {
          return res;
        }
        console.warn(`[Service Binding] 503 Service Unavailable for ${path}, falling back to direct HTTP`);
      } catch (err) {
        console.warn(`[Service Binding] Error calling ${path}:`, err.message, "falling back to direct HTTP");
      }
    }
    const targetUrl = `${fallbackUrl}${path}`;
    console.info(`[Service Fallback] Calling direct HTTP: ${targetUrl}`);
    return fetch(targetUrl, options);
  }

  static async createOrder(prisma, env, customerId, { cartId, addressId, remark, paymentMethod, shippingAddressSnapshot }, authHeader = "") {
    // 1. ดึงข้อมูลตะกร้าสินค้าจาก cart-svc
    const cartRes = await this.safeFetch(env.CART_SVC, "http://localhost:8790", `/carts/${cartId}`, {
      headers: { Authorization: authHeader },
    });
    if (!cartRes.ok) {
      throw new Error("CART_NOT_FOUND");
    }
    const cart = await cartRes.json();
    if (!cart.items || cart.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    // 2. ตรวจสอบสต็อกกับ inventory-svc
    const checkItems = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const stockRes = await this.safeFetch(env.INVENTORY_SVC, "http://localhost:8797", "/stock/check", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ items: checkItems }),
    });

    if (!stockRes.ok) {
      if (stockRes.status === 409) {
        throw new Error("OUT_OF_STOCK");
      }
      throw new Error("STOCK_CHECK_FAILED");
    }

    // 3. บันทึกออเดอร์พร้อมทำ Snapshot ราคาและที่อยู่ลง Postgres
    const totalAmount = cart.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const shippingFee = 0;
    const discountAmount = 0;
    const grandTotal = totalAmount + shippingFee - discountAmount;

    let order;
    try {
      order = await prisma.order.create({
        data: {
          customerId,
          addressId,
          shippingAddressSnapshot: shippingAddressSnapshot, // บันทึกเป็น JSON snapshot
          totalAmount,
          shippingFee,
          discountAmount,
          grandTotal,
          status: "pending",
          paymentMethod: paymentMethod || "online",
          remark: remark || null,
          items: {
            create: cart.items.map((item) => {
              const price = Number(item.price);
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: price,
                totalPrice: price * item.quantity,
              };
            }),
          },
        },
        include: {
          items: true,
        },
      });
    } catch (err) {
      console.error("[OrderService] Failed to write order to DB:", err);
      throw new Error(`ORDER_WRITE_FAILED: ${err.message}`);
    }

    // 5. สั่งจองสต็อกกับ inventory-svc
    const reserveRes = await this.safeFetch(env.INVENTORY_SVC, "http://localhost:8797", "/stock/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        orderId: order.orderId,
        items: checkItems,
      }),
    });

    if (!reserveRes.ok) {
      // หากจองสต็อกล้มเหลว ทำการลบออเดอร์ที่สร้างขึ้นเพื่อ Rollback
      await prisma.order.delete({
        where: { orderId: order.orderId },
      });
      throw new Error("STOCK_RESERVATION_FAILED");
    }

    // 6. ล้างสินค้าในตะกร้าจาก cart-svc
    await this.safeFetch(env.CART_SVC, "http://localhost:8790", `/carts/${cartId}`, {
      method: "DELETE",
      headers: { Authorization: authHeader },
    });

    return order;
  }
}
