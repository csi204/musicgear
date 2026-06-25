import { Hono } from "hono";
import { createClient } from "../db/client.js";
import { getProductById } from "../services/product.service.js";

export const productRoutes = new Hono();

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/:productId — ดึงข้อมูลสินค้าพร้อมรูปภาพ (Contract 6 กับบุญ)
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/:productId", async (c) => {
  const productId = c.req.param("productId");

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(productId)) {
    return c.json({ error: { code: "INVALID_PRODUCT_ID", message: "productId must be a valid UUID" } }, 400);
  }

  const db = createClient(c.env.DATABASE_URL);

  try {
    const product = await getProductById(db, productId);

    if (!product) {
      return c.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }

    return c.json({
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price.toString()),
      sku: product.sku,
      status: product.status,
      description: product.description ?? null,
      skillLevel: product.skillLevel ?? null,
      brand: product.brand,
      category: product.category,
      images: product.images.map((img) => ({
        imageId: img.imageId,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder,
      })),
    });
  } catch (err) {
    console.error("[GET /products/:productId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});
