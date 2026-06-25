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
