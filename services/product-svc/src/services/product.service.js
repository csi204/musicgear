// ---------------------------------------------------------------------------
// getProductById — ดึงข้อมูลสินค้าพร้อมรูปภาพสำหรับ Contract 6
// ---------------------------------------------------------------------------

/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} productId
 */
export async function getProductById(db, productId) {
  const product = await db.product.findUnique({
    where: { productId },
    select: {
      productId: true,
      name: true,
      slug: true,
      price: true,
      status: true,
      sku: true,
      description: true,
      skillLevel: true,
      brand: { select: { brandId: true, name: true } },
      category: { select: { categoryId: true, name: true } },
      images: {
        select: { imageId: true, imageUrl: true, isPrimary: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return product;
}

// ---------------------------------------------------------------------------
// getAllProducts — ดึงข้อมูลสินค้าพร้อมระบบกรองและ pagination
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {object} filters
 */
export async function getAllProducts(db, filters = {}) {
  const { brandId, categoryId, search, skillLevel, status, page = 1, limit = 10 } = filters;
  const where = {};

  if (brandId) where.brandId = brandId;
  if (categoryId) where.categoryId = categoryId;
  if (skillLevel) where.skillLevel = skillLevel;
  if (status && status !== "all") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, parseInt(limit) || 10);

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      select: {
        productId: true,
        name: true,
        slug: true,
        price: true,
        status: true,
        sku: true,
        description: true,
        skillLevel: true,
        brand: { select: { brandId: true, name: true } },
        category: { select: { categoryId: true, name: true } },
        images: {
          select: { imageId: true, imageUrl: true, isPrimary: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
    db.product.count({ where }),
  ]);

  return {
    products,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit),
  };
}

// ---------------------------------------------------------------------------
// getProductBySlug — ดึงข้อมูลสินค้าผ่าน slug (SEO friendly)
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} slug
 */
export async function getProductBySlug(db, slug) {
  return await db.product.findUnique({
    where: { slug },
    select: {
      productId: true,
      name: true,
      slug: true,
      price: true,
      status: true,
      sku: true,
      description: true,
      skillLevel: true,
      brand: { select: { brandId: true, name: true } },
      category: { select: { categoryId: true, name: true } },
      images: {
        select: { imageId: true, imageUrl: true, isPrimary: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// createProduct — สร้างสินค้าใหม่พร้อมบันทึกรูปภาพลงฐานข้อมูล
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {object} data
 * @param {Array} images
 */
export async function createProduct(db, data, images = []) {
  const product = await db.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      price: data.price,
      sku: data.sku,
      status: data.status || "active",
      skillLevel: data.skillLevel || null,
      brandId: data.brandId,
      categoryId: data.categoryId,
      description: data.description || null,
    },
  });

  if (images && images.length > 0) {
    await db.productImage.createMany({
      data: images.map((img) => ({
        productId: product.productId,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary || false,
        sortOrder: img.sortOrder || 0,
      })),
    });
  }

  // ดึงสินค้าเวอร์ชันล่าสุดที่มี relation ครบถ้วน
  return await db.product.findUnique({
    where: { productId: product.productId },
    include: {
      brand: true,
      category: true,
      images: true,
    },
  });
}

// ---------------------------------------------------------------------------
// updateProduct — อัปเดตรายละเอียดสินค้าและรายการรูปภาพ
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} productId
 * @param {object} data
 * @param {Array|null} images — ถ้าเป็น null จะไม่มีการแตะต้องตารางรูปภาพเดิม
 */
export async function updateProduct(db, productId, data, images = null) {
  const product = await db.product.update({
    where: { productId },
    data: {
      name: data.name,
      slug: data.slug,
      price: data.price,
      sku: data.sku,
      status: data.status,
      skillLevel: data.skillLevel,
      brandId: data.brandId,
      categoryId: data.categoryId,
      description: data.description,
    },
  });

  if (images !== null) {
    // เคลียร์รูปเก่าทิ้ง
    await db.productImage.deleteMany({
      where: { productId },
    });

    if (images.length > 0) {
      await db.productImage.createMany({
        data: images.map((img) => ({
          productId,
          imageUrl: img.imageUrl,
          isPrimary: img.isPrimary || false,
          sortOrder: img.sortOrder || 0,
        })),
      });
    }
  }

  return await db.product.findUnique({
    where: { productId },
    include: {
      brand: true,
      category: true,
      images: true,
    },
  });
}

// ---------------------------------------------------------------------------
// deleteProduct — ลบสินค้าและข้อมูลเชื่อมโยงทั้งหมด (Cascade)
// ---------------------------------------------------------------------------
/**
 * @param {import("../../generated/prisma/client.js").PrismaClient} db
 * @param {string} productId
 */
export async function deleteProduct(db, productId) {
  // ลบข้อมูลที่ผูกอยู่เพื่อความปลอดภัย
  await db.productImage.deleteMany({ where: { productId } });
  await db.review.deleteMany({ where: { productId } });
  await db.bundleItem.deleteMany({ where: { productId } });

  return await db.product.delete({
    where: { productId },
  });
}
