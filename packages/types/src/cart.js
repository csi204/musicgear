import { z } from "zod";

export const cartCreateSchema = z
  .object({
    customerId: z.string().optional().nullable(),
    sessionId: z.string().trim().min(1).optional().nullable(),
  })
  .strict();

export const cartItemAddSchema = z
  .object({
    productId: z.string().min(1), // Accept any non-empty string ID (not restricted to UUID format)
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    color: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
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
    customerId: z.string(),
  })
  .strict();
