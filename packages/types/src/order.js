import { z } from "zod";

const OrderStatusEnum = z.enum([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const orderListQuerySchema = z
  .object({
    customerId: z.string().uuid("customerId must be a valid UUID").optional(),
    status: OrderStatusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const orderStatusUpdateSchema = z
  .object({
    status: OrderStatusEnum,
  })
  .strict();

export const orderCreateSchema = z
  .object({
    cartId: z.string().uuid("cartId must be a valid UUID"),
    addressId: z.string().uuid("addressId must be a valid UUID"),
    remark: z.string().trim().optional().nullable(),
    shippingAddressSnapshot: z.object({
      receiverName: z.string().trim().min(1).max(120),
      phone: z.string().trim().min(7).max(30),
      addressLine1: z.string().trim().min(1).max(255),
      addressLine2: z.string().trim().max(255).optional().nullable(),
      province: z.string().trim().min(1).max(120),
      city: z.string().trim().min(1).max(120),
      postalCode: z.string().trim().min(3).max(20),
    }),
  })
  .strict();

