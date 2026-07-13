export class CartService {
  /**
   * สร้างตะกร้าใหม่ (Guest -> Redis, User -> Postgres)
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {object} params
   */
  static async createCart(redis, prisma, { customerId, sessionId }) {
    if (customerId) {
      // 1. บันทึกประวัติตะกร้าลูกค้าใน Postgres (Neon) เพื่อความปลอดภัยถาวร
      const cart = await prisma.cart.create({
        data: {
          customerId: customerId,
          sessionId: sessionId || null,
        },
        include: {
          items: true,
        },
      });

      // จัดเก็บ index หรือ mapping เพื่อให้ดึงด้วย customerId ได้เร็ว
      await redis.set(`user_cart:${customerId}`, cart.cartId);
      return cart;
    } else {
      // 2. ถ้าเป็น Guest Cart ให้เก็บไว้ชั่วคราวใน Redis และตั้งอายุ (TTL) 7 วัน
      const cartId = crypto.randomUUID();
      const cart = {
        cartId,
        customerId: null,
        sessionId: sessionId || null,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await redis.set(`cart:${cartId}`, JSON.stringify(cart));
      await redis.expire(`cart:${cartId}`, 604800); // 7 วัน

      return cart;
    }
  }

  /**
   * ดึงข้อมูลตะกร้า (ค้นใน Redis ก่อน ถ้าไม่เจอก็ค้นต่อใน Postgres)
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {string} cartId
   */
  static async getCart(redis, prisma, cartId) {
    // 1. ตรวจสอบใน Redis เสมอ (สำหรับ Guest)
    const cartStr = await redis.get(`cart:${cartId}`);
    if (cartStr) {
      return typeof cartStr === "string" ? JSON.parse(cartStr) : cartStr;
    }

    // 2. ถ้าไม่พบ ให้ไปตรวจสอบต่อใน Postgres (สำหรับ User)
    try {
      const cart = await prisma.cart.findUnique({
        where: { cartId },
        include: {
          items: true,
        },
      });
      if (cart) {
        // แปลง Decimal ใน Postgres เป็น Number ปกติเพื่อให้ข้อมูลสอดคล้องกัน
        return {
          ...cart,
          items: cart.items.map((item) => ({
            ...item,
            price: Number(item.price),
          })),
        };
      }
    } catch (e) {
      console.error("[CartService] Failed to fetch cart from Postgres:", e);
    }

    return null;
  }

  /**
   * เพิ่มสินค้าลงตะกร้า (รองรับการเขียนแยกปลายทาง)
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {string} cartId
   * @param {object} itemData
   */
  static async addItem(redis, prisma, cartId, { productId, quantity, price, color, title, imageUrl, brand }) {
    const cart = await this.getCart(redis, prisma, cartId);
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    if (cart.customerId) {
      // 1. ตะกร้า User -> บันทึกเข้า PostgreSQL (Neon)
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId,
          productId,
          color: color || null,
        },
      });

      let dbItem;
      if (existingItem) {
        dbItem = await prisma.cartItem.update({
          where: { cartItemId: existingItem.cartItemId },
          data: {
            quantity: existingItem.quantity + quantity,
            price: price, // อัปเดตราคาล่าสุด
          },
        });
      } else {
        dbItem = await prisma.cartItem.create({
          data: {
            cartId,
            productId,
            quantity,
            price,
            color: color || null,
            title: title || null,
            imageUrl: imageUrl || null,
            brand: brand || null,
          },
        });
      }

      await prisma.cart.update({
        where: { cartId },
        data: { updatedAt: new Date() },
      });

      return {
        ...dbItem,
        price: Number(dbItem.price),
      };
    } else {
      // 2. ตะกร้า Guest -> บันทึกเข้า Redis
      let item = cart.items.find(
        (i) => i.productId === productId && i.color === (color || null)
      );

      if (item) {
        item.quantity += quantity;
        item.price = price;
      } else {
        item = {
          cartItemId: crypto.randomUUID(),
          productId,
          quantity,
          price,
          color: color || null,
          title: title || null,
          imageUrl: imageUrl || null,
          brand: brand || null,
        };
        cart.items.push(item);
      }

      cart.updatedAt = new Date().toISOString();
      await redis.set(`cart:${cartId}`, JSON.stringify(cart));
      await redis.expire(`cart:${cartId}`, 604800); // Reset TTL

      return item;
    }
  }

  /**
   * ปรับปรุงจำนวนสินค้าในตะกร้า
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {string} cartId
   * @param {string} itemId
   * @param {number} quantity
   */
  static async updateItem(redis, prisma, cartId, itemId, quantity) {
    const cart = await this.getCart(redis, prisma, cartId);
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    if (cart.customerId) {
      // 1. ตะกร้า User -> บันทึกเข้า PostgreSQL (Neon)
      const item = await prisma.cartItem.findFirst({
        where: { cartItemId: itemId, cartId },
      });
      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (quantity <= 0) {
        await prisma.cartItem.delete({
          where: { cartItemId: itemId },
        });
        return null;
      }

      const updated = await prisma.cartItem.update({
        where: { cartItemId: itemId },
        data: { quantity },
      });

      await prisma.cart.update({
        where: { cartId },
        data: { updatedAt: new Date() },
      });

      return {
        ...updated,
        price: Number(updated.price),
      };
    } else {
      // 2. ตะกร้า Guest -> บันทึกเข้า Redis
      const itemIndex = cart.items.findIndex((i) => i.cartItemId === itemId);
      if (itemIndex === -1) {
        throw new Error("ITEM_NOT_FOUND");
      }

      let updatedItem = null;

      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
        updatedItem = cart.items[itemIndex];
      }

      cart.updatedAt = new Date().toISOString();
      await redis.set(`cart:${cartId}`, JSON.stringify(cart));
      await redis.expire(`cart:${cartId}`, 604800); // Reset TTL

      return updatedItem;
    }
  }

  /**
   * ลบสินค้าออกจากตะกร้า
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {string} cartId
   * @param {string} itemId
   */
  static async removeItem(redis, prisma, cartId, itemId) {
    const cart = await this.getCart(redis, prisma, cartId);
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    if (cart.customerId) {
      // 1. ตะกร้า User -> ลบจาก PostgreSQL (Neon)
      const item = await prisma.cartItem.findFirst({
        where: { cartItemId: itemId, cartId },
      });
      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      await prisma.cartItem.delete({
        where: { cartItemId: itemId },
      });

      await prisma.cart.update({
        where: { cartId },
        data: { updatedAt: new Date() },
      });
    } else {
      // 2. ตะกร้า Guest -> ลบจาก Redis
      const itemIndex = cart.items.findIndex((i) => i.cartItemId === itemId);
      if (itemIndex === -1) {
        throw new Error("ITEM_NOT_FOUND");
      }

      cart.items.splice(itemIndex, 1);
      cart.updatedAt = new Date().toISOString();
      await redis.set(`cart:${cartId}`, JSON.stringify(cart));
      await redis.expire(`cart:${cartId}`, 604800); // Reset TTL
    }
  }

  /**
   * ล้างสินค้าในตะกร้าทั้งหมด
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {string} cartId
   */
  static async clearCart(redis, prisma, cartId) {
    const cart = await this.getCart(redis, prisma, cartId);
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    if (cart.customerId) {
      // 1. ตะกร้า User -> ลบสินค้าใน Postgres
      await prisma.cartItem.deleteMany({
        where: { cartId },
      });

      await prisma.cart.update({
        where: { cartId },
        data: { updatedAt: new Date() },
      });
    } else {
      // 2. ตะกร้า Guest -> ลบสินค้าใน Redis
      cart.items = [];
      cart.updatedAt = new Date().toISOString();
      await redis.set(`cart:${cartId}`, JSON.stringify(cart));
      await redis.expire(`cart:${cartId}`, 604800); // Reset TTL
    }
  }

  /**
   * ผสานตะกร้า Guest ใน Redis เข้ากับตะกร้าสมาชิกใน Postgres เมื่อล็อกอิน
   * @param {import("@upstash/redis").Redis} redis
   * @param {import("../../generated/prisma").PrismaClient} prisma
   * @param {object} params
   */
  static async mergeCarts(redis, prisma, { guestCartId, customerId }) {
    // 1. ตรวจสอบตะกร้า Guest จาก Redis
    const guestCart = await this.getCart(redis, prisma, guestCartId);
    if (!guestCart || guestCart.customerId !== null) {
      throw new Error("GUEST_CART_NOT_FOUND");
    }

    // 2. ตรวจหาหรือสร้างตะกร้าของสมาชิกใน Postgres
    let customerCart = await prisma.cart.findFirst({
      where: { customerId },
      include: { items: true },
    });

    if (!customerCart) {
      customerCart = await this.createCart(redis, prisma, { customerId });
    }

    // 3. ผสานรายการสินค้า
    for (const guestItem of guestCart.items) {
      const existingItem = customerCart.items.find(
        (i) => i.productId === guestItem.productId && i.color === guestItem.color
      );

      if (existingItem) {
        await prisma.cartItem.update({
          where: { cartItemId: existingItem.cartItemId },
          data: {
            quantity: existingItem.quantity + guestItem.quantity,
            price: guestItem.price, // ใช้ราคาล่าสุดจาก guest
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: customerCart.cartId,
            productId: guestItem.productId,
            quantity: guestItem.quantity,
            price: guestItem.price,
            color: guestItem.color || null,
            title: guestItem.title || null,
            imageUrl: guestItem.imageUrl || null,
            brand: guestItem.brand || null,
          },
        });
      }
    }

    // 4. ลบตะกร้า Guest ใน Redis ทิ้งทันทีเพื่อไม่ให้เป็นขยะ
    await redis.del(`cart:${guestCartId}`);

    // คืนค่าผลลัพธ์ตะกร้าผสานของลูกค้า
    return prisma.cart.findUnique({
      where: { cartId: customerCart.cartId },
      include: {
        items: true,
      },
    });
  }
}
