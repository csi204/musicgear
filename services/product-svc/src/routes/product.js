import { Hono } from "hono";
import { createClient } from "../db/client.js";
import {
  getProductById,
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from "../services/product.service.js";

export const productRoutes = new Hono();

// Helper to upload a file to Cloudflare R2
async function uploadToR2(bucket, file) {
  const fileExt = file.name.split('.').pop() || 'bin';
  const key = `${crypto.randomUUID()}.${fileExt}`;
  const arrayBuffer = await file.arrayBuffer();
  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: file.type || 'application/octet-stream' }
  });
  return key;
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /products — ดึงรายการสินค้าทั้งหมดพร้อม filter และ pagination
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  
  const query = c.req.query();
  const filters = {
    brandId: query.brandId,
    categoryId: query.categoryId,
    search: query.search,
    skillLevel: query.skillLevel,
    status: query.status || "active", // default to active for customers
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10
  };

  try {
    const result = await getAllProducts(db, filters);
    return c.json({ status: "ok", ...result });
  } catch (err) {
    console.error("[GET /products]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/by-slug/:slug — ค้นหาสินค้าด้วย slug (SEO-friendly)
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/by-slug/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = createClient(c.env.DATABASE_URL);

  try {
    const product = await getProductBySlug(db, slug);
    if (!product) {
      return c.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }
    return c.json({ status: "ok", product });
  } catch (err) {
    console.error("[GET /products/by-slug/:slug]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/images/:key — ดึงรูปภาพโดยตรงจาก Cloudflare R2
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/images/:key", async (c) => {
  const key = c.req.param("key");
  
  if (!c.env.PRODUCT_IMAGES) {
    return c.text("PRODUCT_IMAGES bucket not bound", 500);
  }

  try {
    const object = await c.env.PRODUCT_IMAGES.get(key);
    if (!object) {
      return c.text("Image not found", 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    // Caching for better performance
    headers.set("cache-control", "public, max-age=31536000");

    return new Response(object.body, { headers });
  } catch (err) {
    console.error("[GET /products/images/:key]", err);
    return c.text("Failed to fetch image", 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/bundles — ดึงข้อมูล bundle sets ทั้งหมดพร้อมสินค้าข้างใน
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/bundles", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const bundles = await db.bundle.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                productId: true,
                name: true,
                sku: true,
                price: true,
              }
            }
          }
        }
      }
    });
    return c.json({ status: "ok", bundles }, 200);
  } catch (err) {
    console.error("[GET /products/bundles]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch bundles" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /products/bundles — สร้าง Bundle ใหม่
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.post("/bundles", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Request body is required" } }, 400);
    }

    const { name, description, discountType, discountValue, items } = body;

    if (!name || !discountType || discountValue === undefined || discountValue === null) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "name, discountType, and discountValue are required" } }, 400);
    }

    if (!["percentage", "fixed_amount"].includes(discountType)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "discountType must be 'percentage' or 'fixed_amount'" } }, 400);
    }

    const parsedDiscount = parseFloat(discountValue);
    if (isNaN(parsedDiscount) || parsedDiscount < 0) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "discountValue must be a non-negative number" } }, 400);
    }

    const bundle = await db.bundle.create({
      data: {
        name,
        description: description || null,
        discountType,
        discountValue: parsedDiscount,
      }
    });

    const createdItems = [];
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.productId || !item.quantity) continue;
        const bundleItem = await db.bundleItem.create({
          data: {
            bundleId: bundle.bundleId,
            productId: item.productId,
            quantity: parseInt(item.quantity, 10) || 1,
          }
        });
        createdItems.push(bundleItem);
      }
    }

    return c.json({ status: "ok", bundle: { ...bundle, items: createdItems } }, 201);
  } catch (err) {
    console.error("[POST /products/bundles]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create bundle" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /products/bundles/:bundleId — แก้ไข/อัปเดต Bundle และรายการสินค้าในตัว
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.put("/bundles/:bundleId", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  const bundleId = c.req.param("bundleId");
  try {
    const body = await c.req.json().catch(() => null);
    if (!body) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Request body is required" } }, 400);
    }

    const { name, description, discountType, discountValue, items } = body;

    if (!name || !discountType || discountValue === undefined || discountValue === null) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "name, discountType, and discountValue are required" } }, 400);
    }

    if (!["percentage", "fixed_amount"].includes(discountType)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "discountType must be 'percentage' or 'fixed_amount'" } }, 400);
    }

    const parsedDiscount = parseFloat(discountValue);
    if (isNaN(parsedDiscount) || parsedDiscount < 0) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "discountValue must be a non-negative number" } }, 400);
    }

    // Update main bundle info
    const updatedBundle = await db.bundle.update({
      where: { bundleId },
      data: {
        name,
        description: description || null,
        discountType,
        discountValue: parsedDiscount,
      }
    });

    // Delete existing items
    await db.bundleItem.deleteMany({
      where: { bundleId }
    });

    // Re-create items sequentially
    const createdItems = [];
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.productId || !item.quantity) continue;
        const bundleItem = await db.bundleItem.create({
          data: {
            bundleId,
            productId: item.productId,
            quantity: parseInt(item.quantity, 10) || 1,
          }
        });
        createdItems.push(bundleItem);
      }
    }

    return c.json({ status: "ok", bundle: { ...updatedBundle, items: createdItems } }, 200);
  } catch (err) {
    console.error("[PUT /products/bundles/:bundleId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to update bundle" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /products/bundles/:bundleId — ลบ Bundle
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.delete("/bundles/:bundleId", async (c) => {
  const bundleId = c.req.param("bundleId");
  const db = createClient(c.env.DATABASE_URL);

  try {
    // Delete associated bundle items first
    await db.bundleItem.deleteMany({
      where: { bundleId }
    });

    // Delete the bundle itself
    const deleted = await db.bundle.delete({
      where: { bundleId }
    });

    return c.json({ status: "ok", message: "Bundle deleted successfully", bundle: deleted }, 200);
  } catch (err) {
    console.error("[DELETE /products/bundles/:bundleId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/categories — ดึงข้อมูลหมวดหมู่ทั้งหมด
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/categories", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const categories = await db.category.findMany();
    return c.json({ status: "ok", categories }, 200);
  } catch (err) {
    console.error("[GET /products/categories]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch categories" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/brands — ดึงข้อมูลแบรนด์ทั้งหมด
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.get("/brands", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const brands = await db.brand.findMany();
    return c.json({ status: "ok", brands }, 200);
  } catch (err) {
    console.error("[GET /products/brands]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to fetch brands" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /products/brands — สร้างแบรนด์ใหม่
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.post("/brands", async (c) => {
  const db = createClient(c.env.DATABASE_URL);
  try {
    const body = await c.req.json().catch(() => null);
    if (!body || !body.name) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "name is required" } }, 400);
    }

    const { name } = body;
    // Check if brand already exists
    let brand = await db.brand.findFirst({
      where: { name: { equals: name } }
    });

    if (!brand) {
      brand = await db.brand.create({
        data: { name }
      });
    }

    return c.json({ status: "ok", brand }, 201);
  } catch (err) {
    console.error("[POST /products/brands]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to create brand" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /products/:productId — ดึงข้อมูลสินค้าพร้อมรูปภาพด้วย UUID
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
      recommendations: product.recommendations || [],
    });
  } catch (err) {
    console.error("[GET /products/:productId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /products — สร้างสินค้าใหม่ (รองรับ Multipart Form Data สำหรับอัปโหลดรูปภาพ)
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.post("/", async (c) => {
  const db = createClient(c.env.DATABASE_URL);

  try {
    let body;
    const contentType = c.req.header("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await c.req.json().catch(() => ({}));
    } else {
      body = await c.req.parseBody({ all: true });
    }

    const { name, price, sku, brandId, categoryId } = body;

    let finalBrandId = brandId || undefined;
    let finalCategoryId = categoryId || undefined;

    if (!finalBrandId) {
      const firstBrand = await db.brand.findFirst();
      if (firstBrand) finalBrandId = firstBrand.brandId;
    }
    if (!finalCategoryId) {
      const firstCategory = await db.category.findFirst();
      if (firstCategory) finalCategoryId = firstCategory.categoryId;
    }
    
    if (!name || price === undefined || price === null || !sku || !finalBrandId || !finalCategoryId) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Missing required fields: name, price, sku, brandId and categoryId are required" } }, 400);
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Price must be a valid number" } }, 400);
    }

    let slugBase = body.slug || name.toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!slugBase) {
      slugBase = sku.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (!slugBase) {
      slugBase = "product";
    }

    let slug = slugBase;
    let suffix = 1;
    while (true) {
      const existingSlug = await db.product.findUnique({
        where: { slug }
      });
      if (!existingSlug) {
        break;
      }
      slug = `${slugBase}-${suffix}`;
      suffix++;
    }

    // ดึงไฟล์รูปภาพที่อัปโหลด
    const filesList = [];
    const imageFields = ["images", "imageFiles"];
    for (const field of imageFields) {
      if (body[field]) {
        const val = body[field];
        const fields = Array.isArray(val) ? val : [val];
        for (const file of fields) {
          if (file && typeof file === "object" && file.name) {
            filesList.push(file);
          }
        }
      }
    }

    let dbImages = [];
    if (c.env.PRODUCT_IMAGES && filesList.length > 0) {
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        const key = await uploadToR2(c.env.PRODUCT_IMAGES, file);
        const originUrl = new URL(c.req.url).origin;
        const publicUrl = c.env.R2_PUBLIC_URL
          ? `${c.env.R2_PUBLIC_URL}/${key}`
          : `${originUrl}/products/images/${key}`;

        dbImages.push({
          imageUrl: publicUrl,
          isPrimary: i === 0,
          sortOrder: i
        });
      }
    } else if (body.images) {
      if (Array.isArray(body.images)) {
        dbImages = body.images;
      } else if (typeof body.images === "string") {
        try {
          const parsed = JSON.parse(body.images);
          if (Array.isArray(parsed)) dbImages = parsed;
        } catch {}
      }
    } else if (!c.env.PRODUCT_IMAGES) {
      console.warn("PRODUCT_IMAGES bucket not bound");
    }

    let recommendations = [];
    if (body.recommendations) {
      if (typeof body.recommendations === "string") {
        try {
          recommendations = JSON.parse(body.recommendations);
        } catch {
          recommendations = body.recommendations.split(",").map(id => id.trim()).filter(Boolean);
        }
      } else if (Array.isArray(body.recommendations)) {
        recommendations = body.recommendations;
      }
    }

    const productData = {
      name,
      slug,
      price: parsedPrice,
      sku,
      status: body.status || "active",
      skillLevel: body.skillLevel || null,
      brandId: finalBrandId,
      categoryId: finalCategoryId,
      description: body.description || null,
      recommendations
    };

    const product = await createProduct(db, productData, dbImages);

    // ยิง Event ไปหา QStash US region
    const qstashUrl = c.env.QSTASH_URL;
    const qstashToken = c.env.QSTASH_TOKEN;
    const inventorySvcUrl = c.env.INVENTORY_SVC_URL;

    if (qstashUrl && qstashToken && inventorySvcUrl) {
      const subscriberUrl = `${inventorySvcUrl.replace(/\/$/, "")}/webhooks/qstash`;
      const payload = {
        event: "product.created",
        productId: product.productId
      };

      console.info(`[product-svc] Publishing product.created to QStash: ${subscriberUrl}`);

      c.executionCtx.waitUntil(
        fetch(`${qstashUrl}/v2/publish/${subscriberUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }).then(async (res) => {
          if (!res.ok) {
            const txt = await res.text();
            console.error(`[product-svc] QStash publish error ${res.status}: ${txt}`);
          } else {
            console.info(`[product-svc] QStash event published successfully.`);
          }
        }).catch(err => {
          console.error(`[product-svc] QStash publish failed:`, err);
        })
      );
    } else {
      console.warn("[product-svc] QStash variables or INVENTORY_SVC_URL not set — skipping publish");
    }

    return c.json({ status: "ok", product }, 201);
  } catch (err) {
    console.error("[POST /products]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /products/:productId — แก้ไขรายละเอียดสินค้า
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.patch("/:productId", async (c) => {
  const productId = c.req.param("productId");
  const db = createClient(c.env.DATABASE_URL);

  try {
    const existing = await getProductById(db, productId);
    if (!existing) {
      return c.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }

    let body;
    const contentType = c.req.header("Content-Type") || "";
    if (contentType.includes("multipart/form-data")) {
      body = await c.req.parseBody({ all: true });
    } else {
      try {
        body = await c.req.json();
      } catch {
        body = {};
      }
    }

    const price = body.price !== undefined ? parseFloat(body.price) : undefined;
    if (body.price !== undefined && isNaN(price)) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "Price must be a valid number" } }, 400);
    }

    // จัดการอัปโหลดรูปภาพใหม่ (ถ้าถูกส่งมาใน multipart request)
    let dbImages = null;
    if (contentType.includes("multipart/form-data")) {
      const filesList = [];
      const imageFields = ["images", "imageFiles"];
      
      let existingImages = [];
      if (body.images) {
        const imagesField = Array.isArray(body.images) ? body.images : [body.images];
        for (const item of imagesField) {
          if (typeof item === "string") {
            try {
              const parsed = JSON.parse(item);
              if (Array.isArray(parsed)) {
                existingImages = parsed;
                break;
              }
            } catch {}
          }
        }
      }

      for (const field of imageFields) {
        if (body[field]) {
          const val = body[field];
          const fields = Array.isArray(val) ? val : [val];
          for (const file of fields) {
            if (file && typeof file === "object" && file.name) {
              filesList.push(file);
            }
          }
        }
      }

      if (filesList.length > 0 || existingImages.length > 0) {
        dbImages = [];
        existingImages.forEach((img, idx) => {
          dbImages.push({
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder
          });
        });

        if (filesList.length > 0 && c.env.PRODUCT_IMAGES) {
          for (let i = 0; i < filesList.length; i++) {
            const file = filesList[i];
            const key = await uploadToR2(c.env.PRODUCT_IMAGES, file);
            const originUrl = new URL(c.req.url).origin;
            const publicUrl = c.env.R2_PUBLIC_URL
              ? `${c.env.R2_PUBLIC_URL}/${key}`
              : `${originUrl}/products/images/${key}`;

            dbImages.push({
              imageUrl: publicUrl,
              isPrimary: dbImages.length === 0,
              sortOrder: dbImages.length
            });
          }
        }
      }
    } else if (body.images) {
      if (Array.isArray(body.images)) {
        dbImages = body.images;
      } else if (typeof body.images === "string") {
        try {
          const parsed = JSON.parse(body.images);
          if (Array.isArray(parsed)) dbImages = parsed;
        } catch {}
      }
    }

    let recommendations = undefined;
    if (body.recommendations !== undefined) {
      if (typeof body.recommendations === "string") {
        try {
          recommendations = JSON.parse(body.recommendations);
        } catch {
          recommendations = body.recommendations.split(",").map(id => id.trim()).filter(Boolean);
        }
      } else if (Array.isArray(body.recommendations)) {
        recommendations = body.recommendations;
      }
    }

    const updateData = {
      name: body.name !== undefined ? body.name : existing.name,
      slug: body.slug !== undefined ? body.slug : existing.slug,
      price: price !== undefined ? price : existing.price,
      sku: body.sku !== undefined ? body.sku : existing.sku,
      status: body.status !== undefined ? body.status : existing.status,
      skillLevel: body.skillLevel !== undefined 
        ? (body.skillLevel === "" ? null : body.skillLevel) 
        : existing.skillLevel,
      brandId: body.brandId !== undefined ? body.brandId : existing.brandId,
      categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
      description: body.description !== undefined ? body.description : existing.description,
      recommendations
    };

    const updated = await updateProduct(db, productId, updateData, dbImages);
    return c.json({ status: "ok", product: updated });
  } catch (err) {
    console.error("[PATCH /products/:productId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: err.message, stack: err.stack } }, 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /products/:productId — ลบสินค้า
// ──────────────────────────────────────────────────────────────────────────────
productRoutes.delete("/:productId", async (c) => {
  const productId = c.req.param("productId");
  const db = createClient(c.env.DATABASE_URL);

  try {
    const existing = await getProductById(db, productId);
    if (!existing) {
      return c.json({ error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } }, 404);
    }

    await deleteProduct(db, productId);
    return c.json({ status: "ok", message: "Product deleted successfully" });
  } catch (err) {
    console.error("[DELETE /products/:productId]", err);
    return c.json({ error: { code: "INTERNAL_ERROR", message: "Failed to delete product" } }, 500);
  }
});

