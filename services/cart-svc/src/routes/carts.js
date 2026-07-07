import { Hono } from "hono";
import { CartService } from "../services/cart.service.js";
import { Redis } from "@upstash/redis/cloudflare";
import { createPrisma } from "../db/prisma.js";
import {
  cartCreateSchema,
  cartItemAddSchema,
  cartItemUpdateSchema,
  cartMergeSchema,
} from "../../../../packages/types/src/cart.js";

const router = new Hono();

function getRedis(c) {
  const url = c.env.UPSTASH_REDIS_REST_URL;
  const token = c.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured");
  }
  return new Redis({ url, token });
}

function getPrisma(c) {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  return createPrisma(databaseUrl);
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

// 1. Get Customer Cart by customerId (must be defined BEFORE parametric route /:cartId)
router.get("/customer/:customerId", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const customerId = c.req.param("customerId");
    
    // Check if we have user_cart mapping first in Redis
    let cartId = await redis.get(`user_cart:${customerId}`);
    
    // Fallback: If not in Redis mapping, find cart directly in Postgres
    if (!cartId) {
      const cart = await prisma.cart.findFirst({
        where: { customerId },
      });
      if (cart) {
        cartId = cart.cartId;
        await redis.set(`user_cart:${customerId}`, cartId);
      }
    }

    if (!cartId) {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้าของลูกค้า" } }, 404);
    }

    const cart = await CartService.getCart(redis, prisma, cartId);
    if (!cart) {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้า" } }, 404);
    }
    return c.json(cart, 200);
  } catch (error) {
    console.error("[cart-svc] Get customer cart error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 2. Merge Guest Cart (must be defined BEFORE parametric route /:cartId)
router.post("/merge", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const validation = await parseValidatedJson(c, cartMergeSchema);
    if (!validation.ok) return validation.response;

    const mergedCart = await CartService.mergeCarts(redis, prisma, validation.data);
    return c.json(mergedCart, 200);
  } catch (error) {
    console.error("[cart-svc] Merge carts error:", error);
    if (error.message === "GUEST_CART_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้าของ Guest" } }, 404);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 3. Create Cart
router.post("/", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const validation = await parseValidatedJson(c, cartCreateSchema);
    if (!validation.ok) return validation.response;

    const cart = await CartService.createCart(redis, prisma, validation.data);
    return c.json(cart, 201);
  } catch (error) {
    console.error("[cart-svc] Create cart error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 4. Get Cart
router.get("/:cartId", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const cartId = c.req.param("cartId");
    const cart = await CartService.getCart(redis, prisma, cartId);
    if (!cart) {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้า" } }, 404);
    }
    return c.json(cart, 200);
  } catch (error) {
    console.error("[cart-svc] Get cart error:", error);
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 5. Add Item to Cart
router.post("/:cartId/items", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const cartId = c.req.param("cartId");
    const validation = await parseValidatedJson(c, cartItemAddSchema);
    if (!validation.ok) return validation.response;

    const item = await CartService.addItem(redis, prisma, cartId, validation.data);
    return c.json(item, 201);
  } catch (error) {
    console.error("[cart-svc] Add item error:", error);
    if (error.message === "CART_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้า" } }, 404);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 6. Update Item Quantity in Cart
router.patch("/:cartId/items/:itemId", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const cartId = c.req.param("cartId");
    const itemId = c.req.param("itemId");
    const validation = await parseValidatedJson(c, cartItemUpdateSchema);
    if (!validation.ok) return validation.response;

    const item = await CartService.updateItem(redis, prisma, cartId, itemId, validation.data.quantity);
    if (item === null) {
      return c.json({ status: "deleted" }, 200);
    }
    return c.json(item, 200);
  } catch (error) {
    console.error("[cart-svc] Update item error:", error);
    if (error.message === "ITEM_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบสินค้าในตะกร้า" } }, 404);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 7. Delete Item from Cart
router.delete("/:cartId/items/:itemId", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const cartId = c.req.param("cartId");
    const itemId = c.req.param("itemId");
    await CartService.removeItem(redis, prisma, cartId, itemId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[cart-svc] Remove item error:", error);
    if (error.message === "ITEM_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบสินค้าในตะกร้า" } }, 404);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

// 8. Clear Cart
router.delete("/:cartId", async (c) => {
  try {
    const redis = getRedis(c);
    const prisma = getPrisma(c);
    const cartId = c.req.param("cartId");
    await CartService.clearCart(redis, prisma, cartId);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[cart-svc] Clear cart error:", error);
    if (error.message === "CART_NOT_FOUND") {
      return c.json({ error: { code: "NOT_FOUND", message: "ไม่พบตะกร้าสินค้า" } }, 404);
    }
    return c.json({ error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});

export default router;
