import { Hono } from "hono";
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { createPrismaClient } from "./createClient.js";
import {
  addressCreateSchema,
  addressUpdateSchema,
  profileUpdateSchema,
  roleAssignmentSchema,
  staffUpdateSchema,
  userListQuerySchema,
  userStatusUpdateSchema,
} from "../../../packages/types/src/user.js";

const app = new Hono();
const authMiddleware = createAuthMiddleware("musicgear.kinde.com");
const adminMiddleware = createRoleMiddleware(["admin"]);

let prismaClient;

function getPrismaClient(c) {
  const connectionString = c.env.DATABASE_URL || c.env.PRISMA_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!prismaClient) {
    prismaClient = createPrismaClient(connectionString);
  }

  return prismaClient;
}

function getAuthUser(c) {
  const user = c.get("user");
  if (!user?.sub) {
    throw new Error("Authenticated token is missing sub");
  }

  // Kinde access_token doesn't include email by default (it's in id_token)
  // Use sub-based placeholder if email is missing
  const email = user.email || user.preferred_email || `${user.sub}@kinde.user`;

  // Kinde stores roles as [{id, key, name}] array in access_token
  const kindeRoles = Array.isArray(user.roles) ? user.roles : [];
  const roleKey = kindeRoles[0]?.key ?? null;

  // Fallback: also support flat "role" string claim
  const rawRole = roleKey || (typeof user.role === "string" ? user.role : null) || "customer";
  const normalizedRole = ["customer", "staff", "admin"].includes(rawRole.toLowerCase())
    ? rawRole.toLowerCase()
    : "customer";

  return {
    userId: user.sub,
    email,
    firstName: user.given_name || user.first_name || "MusicGear",
    lastName: user.family_name || user.last_name || "User",
    role: normalizedRole,
  };
}

async function loadUser(prisma, userId) {
  return prisma.user.findUnique({
    where: { userId },
    include: {
      customer: { include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } } },
      staff: true,
      admin: true,
    },
  });
}

function sanitizeUser(user) {
  if (!user) {
    return user;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function ensureUser(prisma, authUser) {
  const existingUser = await loadUser(prisma, authUser.userId);
  if (existingUser) {
    if (existingUser.status === "banned" || existingUser.status === "inactive") {
      const error = new Error("Account is disabled");
      error.code = "ACCOUNT_DISABLED";
      throw error;
    }

    return existingUser;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: {
      customer: { include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] } } },
      staff: true,
      admin: true,
    },
  });

  if (existingByEmail) {
    if (existingByEmail.status === "banned" || existingByEmail.status === "inactive") {
      const error = new Error("Account is disabled");
      error.code = "ACCOUNT_DISABLED";
      throw error;
    }

    return existingByEmail;
  }

  const createData = {
    userId: authUser.userId,
    email: authUser.email,
    passwordHash: "",
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    phone: null,
    role: authUser.role,
    status: "active",
  };

  if (authUser.role === "customer") {
    createData.customer = { create: { customerId: authUser.userId } };
  } else if (authUser.role === "admin") {
    createData.admin = { create: { adminId: authUser.userId } };
  } else if (authUser.role === "staff") {
    createData.staff = { create: { staffId: authUser.userId, position: "Unassigned" } };
  }

  await prisma.user.create({ data: createData });

  return loadUser(prisma, authUser.userId);
}

async function ensureCustomer(prisma, userId) {
  const customer = await prisma.customer.findUnique({ where: { customerId: userId } });
  if (customer) {
    return customer;
  }

  return prisma.customer.create({ data: { customerId: userId } });
}

async function parseValidatedJson(c, schema) {
  let payload;

  try {
    payload = await c.req.json();
  } catch {
    return {
      ok: false,
      response: c.json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON" } }, 400),
    };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      response: c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            issues: result.error.flatten(),
          },
        },
        400,
      ),
    };
  }

  return { ok: true, data: result.data };
}

function parseValidatedQuery(c, schema) {
  const query = Object.fromEntries(new URL(c.req.url).searchParams.entries());
  const result = schema.safeParse(query);

  if (!result.success) {
    return {
      ok: false,
      response: c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            issues: result.error.flatten(),
          },
        },
        400,
      ),
    };
  }

  return { ok: true, data: result.data };
}

function requireCustomerRole(c, authUser) {
  if (authUser.role !== "customer") {
    return c.json({ error: { code: "FORBIDDEN", message: "Customer role required" } }, 403);
  }

  return null;
}

async function assignRoleTransaction(tx, userId, role, position) {
  const user = await tx.user.findUnique({
    where: { userId },
    include: { customer: true, staff: true, admin: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await tx.user.update({ where: { userId }, data: { role } });

  if (role === "customer") {
    if (!user.customer) {
      await tx.customer.create({ data: { customerId: userId } });
    }
    if (user.staff) {
      await tx.staff.delete({ where: { staffId: userId } });
    }
    if (user.admin) {
      await tx.admin.delete({ where: { adminId: userId } });
    }
  } else if (role === "staff") {
    if (!user.staff) {
      await tx.staff.create({ data: { staffId: userId, position: position || "Unassigned" } });
    } else if (position) {
      await tx.staff.update({ where: { staffId: userId }, data: { position } });
    }
    if (user.admin) {
      await tx.admin.delete({ where: { adminId: userId } });
    }
  } else if (role === "admin") {
    if (!user.admin) {
      await tx.admin.create({ data: { adminId: userId } });
    }
    if (user.staff) {
      await tx.staff.delete({ where: { staffId: userId } });
    }
  }

  return loadUser(tx, userId);
}

function handleRouteError(c, error) {
  if (error?.code === "ACCOUNT_DISABLED") {
    return c.json({ error: { code: "ACCOUNT_DISABLED", message: "Account is disabled" } }, 403);
  }

  if (error?.code === "NOT_FOUND") {
    return c.json({ error: { code: "NOT_FOUND", message: "User not found" } }, 404);

  }

  if (error?.code === "FORBIDDEN") {
    return c.json({ error: { code: "FORBIDDEN", message: error.message } }, 403);
  }

  console.error("[user-svc] Unhandled route error:", error?.message ?? error);
  return c.json({ error: { code: "INTERNAL_ERROR", message: error?.message ?? "Internal server error" } }, 500);
}

// Global error handler — catches anything that re-throws from routes
app.onError((err, c) => {
  console.error("[user-svc] Uncaught error:", err?.message ?? err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: err?.message ?? "Internal server error" } }, 500);
});

app.get("/health", (c) => c.json({ status: "ok", service: "user-svc" }));

app.use("/users/*", authMiddleware);

app.get("/users/staff", adminMiddleware, async (c) => {
  const prisma = getPrismaClient(c);
  const staffMembers = await prisma.staff.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({
    status: "ok",
    staff: staffMembers.map((staff) => ({
      staffId: staff.staffId,
      position: staff.position,
      user: sanitizeUser(staff.user),
    })),
  });
});

app.patch("/users/staff/:staffId", adminMiddleware, async (c) => {
  const prisma = getPrismaClient(c);
  const validation = await parseValidatedJson(c, staffUpdateSchema);
  if (!validation.ok) {
    return validation.response;
  }

  const staffId = c.req.param("staffId");
  const existingStaff = await prisma.staff.findUnique({ where: { staffId } });
  if (!existingStaff) {
    return c.json({ error: { code: "NOT_FOUND", message: "Staff not found" } }, 404);
  }

  const staff = await prisma.staff.update({
    where: { staffId },
    data: { position: validation.data.position },
    include: { user: true },
  });

  return c.json({
    status: "ok",
    staff: {
      staffId: staff.staffId,
      position: staff.position,
      user: sanitizeUser(staff.user),
    },
  });
});

app.get("/users", adminMiddleware, async (c) => {
  const prisma = getPrismaClient(c);
  const validation = parseValidatedQuery(c, userListQuerySchema);
  if (!validation.ok) {
    return validation.response;
  }

  const { page, limit, role, status, search } = validation.data;
  const where = {};

  if (role) {
    where.role = role;
  }
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { customer: true, staff: true, admin: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return c.json({
    status: "ok",
    users: users.map(sanitizeUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

app.get("/users/me", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const user = await ensureUser(prisma, authUser);

    return c.json({ status: "ok", user: sanitizeUser(user) });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.patch("/users/me", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const validation = await parseValidatedJson(c, profileUpdateSchema);
    if (!validation.ok) {
      return validation.response;
    }

    const updates = validation.data;
    const hasUserUpdates = Boolean(updates.firstName || updates.lastName || updates.phone !== undefined);
    const hasCustomerUpdates = Boolean(updates.dateOfBirth !== undefined || updates.gender !== undefined);

    if (!hasUserUpdates && !hasCustomerUpdates) {
      return c.json({ error: { code: "VALIDATION_ERROR", message: "No fields provided" } }, 400);
    }

    const currentUser = await ensureUser(prisma, authUser);

    const userData = {};
    if (updates.firstName !== undefined) userData.firstName = updates.firstName;
    if (updates.lastName !== undefined) userData.lastName = updates.lastName;
    if (updates.phone !== undefined) userData.phone = updates.phone;

    const customerData = {};
    if (updates.dateOfBirth !== undefined) customerData.dateOfBirth = updates.dateOfBirth;
    if (updates.gender !== undefined) customerData.gender = updates.gender;

    const updatedUser = await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { userId: currentUser.userId }, data: userData });
      }

      if (Object.keys(customerData).length > 0) {
        if (authUser.role !== "customer") {
          throw Object.assign(new Error("Customer profile fields require customer role"), { code: "FORBIDDEN" });
        }

        await ensureCustomer(tx, currentUser.userId);
        await tx.customer.update({ where: { customerId: currentUser.userId }, data: customerData });
      }

      return loadUser(tx, currentUser.userId);
    });

    return c.json({ status: "ok", user: sanitizeUser(updatedUser) });
  } catch (error) {
    if (error?.code === "FORBIDDEN") {
      return c.json({ error: { code: "FORBIDDEN", message: error.message } }, 403);
    }

    return handleRouteError(c, error);
  }
});

app.get("/users/:userId", adminMiddleware, async (c) => {
  const prisma = getPrismaClient(c);
  const userId = c.req.param("userId");
  const user = await loadUser(prisma, userId);

  if (!user) {
    return c.json({ error: { code: "NOT_FOUND", message: "User not found" } }, 404);
  }

  return c.json({ status: "ok", user: sanitizeUser(user) });
});

app.patch("/users/:userId/status", adminMiddleware, async (c) => {
  const prisma = getPrismaClient(c);
  const userId = c.req.param("userId");
  const validation = await parseValidatedJson(c, userStatusUpdateSchema);
  if (!validation.ok) {
    return validation.response;
  }

  const existingUser = await prisma.user.findUnique({ where: { userId } });
  if (!existingUser) {
    return c.json({ error: { code: "NOT_FOUND", message: "User not found" } }, 404);
  }

  const updatedUser = await prisma.user.update({
    where: { userId },
    data: { status: validation.data.status },
  });

  const user = await loadUser(prisma, updatedUser.userId);

  return c.json({ status: "ok", user: sanitizeUser(user) });
});

app.patch("/users/:userId/role", adminMiddleware, async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const userId = c.req.param("userId");
    const validation = await parseValidatedJson(c, roleAssignmentSchema);
    if (!validation.ok) {
      return validation.response;
    }

    const existingUser = await prisma.user.findUnique({ where: { userId } });
    if (!existingUser) {
      return c.json({ error: { code: "NOT_FOUND", message: "User not found" } }, 404);
    }

    const user = await prisma.$transaction(async (tx) =>
      assignRoleTransaction(tx, userId, validation.data.role, validation.data.position),
    );

    return c.json({ status: "ok", user: sanitizeUser(user) });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.get("/users/me/addresses", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const accessError = requireCustomerRole(c, authUser);
    if (accessError) {
      return accessError;
    }

    const user = await ensureUser(prisma, authUser);
    const customer = await ensureCustomer(prisma, user.userId);

    const addresses = await prisma.address.findMany({
      where: { customerId: customer.customerId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return c.json({ status: "ok", addresses });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.post("/users/me/addresses", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const accessError = requireCustomerRole(c, authUser);
    if (accessError) {
      return accessError;
    }

    const validation = await parseValidatedJson(c, addressCreateSchema);
    if (!validation.ok) {
      return validation.response;
    }

    const user = await ensureUser(prisma, authUser);
    const customer = await ensureCustomer(prisma, user.userId);
    const addressData = validation.data;

    const address = await prisma.$transaction(async (tx) => {
      if (addressData.isDefault) {
        await tx.address.updateMany({
          where: { customerId: customer.customerId },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          customerId: customer.customerId,
          receiverName: addressData.receiverName,
          phone: addressData.phone,
          addressLine1: addressData.addressLine1,
          addressLine2: addressData.addressLine2 || null,
          province: addressData.province,
          city: addressData.city,
          postalCode: addressData.postalCode,
          isDefault: Boolean(addressData.isDefault),
        },
      });
    });

    return c.json({ status: "ok", address }, 201);
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.patch("/users/me/addresses/:addressId", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const accessError = requireCustomerRole(c, authUser);
    if (accessError) {
      return accessError;
    }

    const validation = await parseValidatedJson(c, addressUpdateSchema);
    if (!validation.ok) {
      return validation.response;
    }

    const updates = validation.data;
    const addressId = c.req.param("addressId");
    const user = await ensureUser(prisma, authUser);
    const customer = await ensureCustomer(prisma, user.userId);

    const existingAddress = await prisma.address.findFirst({
      where: { addressId, customerId: customer.customerId },
    });

    if (!existingAddress) {
      return c.json({ error: { code: "NOT_FOUND", message: "Address not found" } }, 404);
    }

    const address = await prisma.$transaction(async (tx) => {
      if (updates.isDefault) {
        await tx.address.updateMany({
          where: { customerId: customer.customerId },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { addressId },
        data: {
          receiverName: updates.receiverName ?? existingAddress.receiverName,
          phone: updates.phone ?? existingAddress.phone,
          addressLine1: updates.addressLine1 ?? existingAddress.addressLine1,
          addressLine2: updates.addressLine2 !== undefined ? updates.addressLine2 : existingAddress.addressLine2,
          province: updates.province ?? existingAddress.province,
          city: updates.city ?? existingAddress.city,
          postalCode: updates.postalCode ?? existingAddress.postalCode,
          isDefault: updates.isDefault ?? existingAddress.isDefault,
        },
      });
    });

    return c.json({ status: "ok", address });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.delete("/users/me/addresses/:addressId", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const accessError = requireCustomerRole(c, authUser);
    if (accessError) {
      return accessError;
    }

    const addressId = c.req.param("addressId");
    const user = await ensureUser(prisma, authUser);
    const customer = await ensureCustomer(prisma, user.userId);

    const existingAddress = await prisma.address.findFirst({
      where: { addressId, customerId: customer.customerId },
    });

    if (!existingAddress) {
      return c.json({ error: { code: "NOT_FOUND", message: "Address not found" } }, 404);
    }

    await prisma.address.delete({ where: { addressId } });

    return c.json({ status: "ok" });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

app.post("/users/me/addresses/:addressId/default", async (c) => {
  try {
    const prisma = getPrismaClient(c);
    const authUser = getAuthUser(c);
    const accessError = requireCustomerRole(c, authUser);
    if (accessError) {
      return accessError;
    }

    const addressId = c.req.param("addressId");
    const user = await ensureUser(prisma, authUser);
    const customer = await ensureCustomer(prisma, user.userId);

    const existingAddress = await prisma.address.findFirst({
      where: { addressId, customerId: customer.customerId },
    });

    if (!existingAddress) {
      return c.json({ error: { code: "NOT_FOUND", message: "Address not found" } }, 404);
    }

    const address = await prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { customerId: customer.customerId },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { addressId },
        data: { isDefault: true },
      });
    });

    return c.json({ status: "ok", address });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

export default app;
