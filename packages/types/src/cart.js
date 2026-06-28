import { z } from "zod";

export const cartCreateSchema = z
  .object({
    customerId: z.string().uuid().optional().nullable(),
    sessionId: z.string().trim().min(1).optional().nullable(),
  })
  .strict();

export const cartItemAddSchema = z
  .object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })
  .strict();

export const cartItemUpdateSchema = z
  .object({
    quantity: z.number().int().nonnegative(),
  })
  .strict();

export const cartMergeSchema = z
  .object({
    guestCartId: z.string().uuid(),
    customerId: z.string().uuid(),
  })
  .strict();
