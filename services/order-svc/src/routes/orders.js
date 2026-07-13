import { Hono } from "hono";
import { OrderService } from "../services/order.service.js";
import { createPrisma } from "../db/prisma.js";
import {
  orderListQuerySchema,
  orderStatusUpdateSchema,
  orderCreateSchema,
} from "../../../../packages/types/src/order.js";

const router = new Hono();

function getPrisma(c) {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  return createPrisma(databaseUrl);
}

function getAuthUser(c) {
  const user = c.get("user");

  if (user?.gty && user.gty.includes("client_credentials")) {
    return {
      userId: user.azp || "m2m-admin",
      email: "m2m@musicgear.local",
      role: "admin",
    };
  }

  if (!user?.sub) {
    throw new Error("Authenticated token is missing sub");
  }

  const kindeRoles = Array.isArray(user.roles) ? user.roles : [];
  const roleKey = kindeRoles[0]?.key ?? null;
  const rawRole = roleKey || (typeof user.role === "string" ? user.role : null) || "customer";
  const normalizedRole = ["customer", "staff", "admin"].includes(rawRole.toLowerCase())
    ? rawRole.toLowerCase()
    : "customer";

  return {
    userId: user.sub,
    email: user.email || `${user.sub}@kinde.user`,
    role: normalizedRole,
  };
}

async function parseValidatedJson(c, schema) {
  let payload;
  try {
    payload = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400),
    };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      response: c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            issues: result.error.flatten(),
          },
        },
        400,
      ),
    };
  }

  return { ok: true, data: result.data };
}

function parseValidatedQuery(c, schema) {
  const url = new URL(c.req.url);
  const query = {};
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }

  const result = schema.safeParse(query);
  if (!result.success) {
    return {
      ok: false,
      response: c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            issues: result.error.flatten(),
          },
        },
        400,
      ),
    };
  }

  return { ok: true, data: result.data };
}

// 1. Get Orders List (with validation and RBAC check)
router.get("/", async (c) => {
  try {
    const prisma = getPrisma(c);
    const authUser = getAuthUser(c);
    
    const validation = parseValidatedQuery(c, orderListQuerySchema);
    if (!validation.ok) return validation.response;

    const { customerId, status, page, limit } = validation.data;

    // RBAC: Customer can only view their own history
    if (authUser.role === "customer") {
      if (!customerId || authUser.userId !== customerId) {
        return c.json({ error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงประวัติออเดอร์ของลูกค้าท่านอื่น" } }, 403);
      }
    }

    const result = await OrderService.getOrders(prisma, customerId, { status, page, limit });
    return c.json(result, 200);
  } catch (error) {
    console.error("[order-svc] Get orders list error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// GET /summary — ดึงข้อมูลสรุปออเดอร์สำหรับ Dashboard
router.get("/summary", async (c) => {
  try {
    const prisma = getPrisma(c);
    const authUser = getAuthUser(c);

    // Only staff and admin can access this summary
    if (authUser.role !== "admin" && authUser.role !== "staff") {
      return c.json({ error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้" } }, 403);
    }

    // 1. Calculate Delivery Efficiency
    const [totalOrdersCount, deliveredOrdersCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "delivered" } }),
    ]);

    // 2. Calculate Hourly Fulfillment (Today's orders)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayOrders = await prisma.order.findMany({
      where: {
        orderDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        orderDate: true,
      },
    });

    const hourlyFulfillment = Array(12).fill(0);
    const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
    
    todayOrders.forEach((o) => {
      const date = new Date(o.orderDate);
      const hourStr = String(date.getHours()).padStart(2, "0");
      const idx = hours.indexOf(hourStr);
      if (idx !== -1) {
        hourlyFulfillment[idx]++;
      }
    });

    return c.json({
      status: "ok",
      totalOrdersCount,
      deliveredOrdersCount,
      hourlyFulfillment,
    }, 200);
  } catch (error) {
    console.error("[order-svc] Get order summary error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 2. Get Single Order Detail
router.get("/:orderId", async (c) => {
  try {
    const prisma = getPrisma(c);
    const authUser = getAuthUser(c);
    const orderId = c.req.param("orderId");

    const order = await OrderService.getOrder(prisma, orderId);
    if (!order) {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบคำสั่งซื้อ" } }, 404);
    }

    // RBAC: Customer can only view their own order
    if (authUser.role === "customer" && authUser.userId !== order.customerId) {
      return c.json({ error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้" } }, 403);
    }

    return c.json(order, 200);
  } catch (error) {
    console.error("[order-svc] Get order detail error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 3. Update Order Status (Admin/Staff only)
router.patch("/:orderId/status", async (c) => {
  try {
    const prisma = getPrisma(c);
    const authUser = getAuthUser(c);
    const orderId = c.req.param("orderId");

    // RBAC: Customers cannot update order status
    if (authUser.role !== "admin" && authUser.role !== "staff") {
      return c.json({ error: { code: "FORBIDDEN", message: "เฉพาะผู้ดูแลระบบและพนักงานเท่านั้นที่สามารถเปลี่ยนสถานะออเดอร์ได้" } }, 403);
    }

    const validation = await parseValidatedJson(c, orderStatusUpdateSchema);
    if (!validation.ok) return validation.response;

    const updatedOrder = await OrderService.updateOrderStatus(prisma, orderId, validation.data.status);
    return c.json(updatedOrder, 200);
  } catch (error) {
    console.error("[order-svc] Update order status error:", error);
    if (error.message === "ORDER_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบคำสั่งซื้อ" } }, 404);
    }
    if (error.message.startsWith("INVALID_STATUS_TRANSITION")) {
      return c.json({ error: { code: "BAD_REQUEST", message: "ไม่สามารถเปลี่ยนสถานะข้ามขั้นตอนได้" } }, 400);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 4. Create Order (Checkout Flow)
router.post("/", async (c) => {
  try {
    const prisma = getPrisma(c);
    const authUser = getAuthUser(c);
    
    const validation = await parseValidatedJson(c, orderCreateSchema);
    if (!validation.ok) return validation.response;

    const authHeader = c.req.header("Authorization") || "";
    const newOrder = await OrderService.createOrder(prisma, c.env, authUser.userId, validation.data, authHeader);
    return c.json(newOrder, 201);
  } catch (error) {
    console.error("[order-svc] Create order checkout error:", error);
    
    if (error.message === "CART_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้า" } }, 404);
    }
    if (error.message === "CART_EMPTY") {
      return c.json({ error: { code: "BAD_REQUEST", message: "ตะกร้าสินค้าว่างเปล่า" } }, 400);
    }
    if (error.message === "OUT_OF_STOCK") {
      return c.json({ error: { code: "CONFLICT", message: "สินค้าในสต็อกไม่เพียงพอ" } }, 409);
    }
    if (error.message === "ADDRESS_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบข้อมูลที่จัดส่ง" } }, 404);
    }
    if (error.message === "FORBIDDEN_ADDRESS") {
      return c.json({ error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าใช้งานที่อยู่นี้" } }, 403);
    }
    if (error.message === "STOCK_RESERVATION_FAILED") {
      return c.json({ error: { code: "CONFLICT", message: "การจองสต็อกล้มเหลว กรุณาลองใหม่อีกครั้ง" } }, 409);
    }
    
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

export default router;
