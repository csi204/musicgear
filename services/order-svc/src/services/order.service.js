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
    const where = { customerId };
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

    // If transitioned to "shipped" or others, we might want to also create/update shipment
    // In Phase 1 we just update the Order status.
    const updatedOrder = await prisma.order.update({
      where: { orderId },
      data: { status: newStatus },
      include: {
        items: true,
        shipment: true,
      },
    });

    // ⚠️ TODO: publish QStash event `order.status_changed` (in Phase 3 / Integration)
    
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
}
