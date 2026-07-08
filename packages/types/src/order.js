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
