export class CartService {
  static async createCart(prisma, { customerId, sessionId }) {
    return prisma.cart.create({
      data: {
        customerId: customerId || null,
        sessionId: sessionId || null,
      },
      include: {
        items: true,
      },
    });
  }

  static async getCart(prisma, cartId) {
    return prisma.cart.findUnique({
      where: { cartId },
      include: {
        items: true,
      },
    });
  }

  static async addItem(prisma, cartId, { productId, quantity, price }) {
    // Check if cart exists
    const cart = await prisma.cart.findUnique({
      where: { cartId },
    });
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    // Check if product already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, productId },
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { cartItemId: existingItem.cartItemId },
        data: {
          quantity: existingItem.quantity + quantity,
          price: price, // Update to latest snapshot price
        },
      });
    } else {
      return prisma.cartItem.create({
        data: {
          cartId,
          productId,
          quantity,
          price,
        },
      });
    }
  }

  static async updateItem(prisma, cartId, itemId, quantity) {
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

    return prisma.cartItem.update({
      where: { cartItemId: itemId },
      data: { quantity },
    });
  }

  static async removeItem(prisma, cartId, itemId) {
    const item = await prisma.cartItem.findFirst({
      where: { cartItemId: itemId, cartId },
    });
    if (!item) {
      throw new Error("ITEM_NOT_FOUND");
    }

    await prisma.cartItem.delete({
      where: { cartItemId: itemId },
    });
  }

  static async clearCart(prisma, cartId) {
    const cart = await prisma.cart.findUnique({
      where: { cartId },
    });
    if (!cart) {
      throw new Error("CART_NOT_FOUND");
    }

    await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  static async mergeCarts(prisma, { guestCartId, customerId }) {
    // 1. Find guest cart
    const guestCart = await prisma.cart.findUnique({
      where: { cartId: guestCartId },
      include: { items: true },
    });
    if (!guestCart) {
      throw new Error("GUEST_CART_NOT_FOUND");
    }

    // 2. Find or create customer cart
    let customerCart = await prisma.cart.findFirst({
      where: { customerId },
      include: { items: true },
    });

    if (!customerCart) {
      customerCart = await prisma.cart.create({
        data: { customerId },
        include: { items: true },
      });
    }

    // 3. Merge items (using transaction)
    await prisma.$transaction(async (tx) => {
      for (const guestItem of guestCart.items) {
        const existingCustomerItem = customerCart.items.find(
          (i) => i.productId === guestItem.productId
        );

        if (existingCustomerItem) {
          await tx.cartItem.update({
            where: { cartItemId: existingCustomerItem.cartItemId },
            data: {
              quantity: existingCustomerItem.quantity + guestItem.quantity,
              price: guestItem.price, // Use latest price from guest cart
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: customerCart.cartId,
              productId: guestItem.productId,
              quantity: guestItem.quantity,
              price: guestItem.price,
            },
          });
        }
      }

      // 4. Delete guest cart and items
      await tx.cartItem.deleteMany({
        where: { cartId: guestCartId },
      });
      await tx.cart.delete({
        where: { cartId: guestCartId },
      });
    });

    // Return the updated customer cart
    return prisma.cart.findUnique({
      where: { cartId: customerCart.cartId },
      include: { items: true },
    });
  }
}
