import { z } from "zod";

const nullableString = z.union([z.string().trim().min(1), z.literal("")]).transform((value) => {
  if (value === "") {
    return null;
  }

  return value;
});

export const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    phone: nullableString.optional(),
    dateOfBirth: z.coerce.date().optional().nullable(),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().nullable(),
  })
  .strict();

export const addressCreateSchema = z
  .object({
    receiverName: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(7).max(30),
    addressLine1: z.string().trim().min(1).max(255),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    province: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    postalCode: z.string().trim().min(3).max(20),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const addressUpdateSchema = z
  .object({
    receiverName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(7).max(30).optional(),
    addressLine1: z.string().trim().min(1).max(255).optional(),
    addressLine2: z.string().trim().max(255).optional().nullable(),
    province: z.string().trim().min(1).max(120).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    postalCode: z.string().trim().min(3).max(20).optional(),
    isDefault: z.boolean().optional(),
  })
  .strict();

export const userStatusUpdateSchema = z
  .object({
    status: z.enum(["active", "inactive", "banned"]),
  })
  .strict();

export const roleAssignmentSchema = z
  .object({
    role: z.enum(["customer", "staff", "admin"]),
    position: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.role === "staff" && !data.position) {
      ctx.addIssue({
        code: "custom",
        message: "position is required when role is staff",
        path: ["position"],
      });
    }
  });

export const staffUpdateSchema = z
  .object({
    position: z.string().trim().min(1).max(120),
  })
  .strict();

export const userListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(["customer", "staff", "admin"]).optional(),
    status: z.enum(["active", "inactive", "banned"]).optional(),
    search: z.string().trim().min(1).max(120).optional(),
  })
  .strict();