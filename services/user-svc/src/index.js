import { Hono } from "hono";
import { createAuthMiddleware, createRoleMiddleware } from "@musicgear/auth-middleware";
import { createPrismaClient } from "./createClient.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
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
const requireStaffOrAdmin = createRoleMiddleware(["staff", "admin"]);

const KINDE_JWKS = createRemoteJWKSet(new URL("https://musicgear.kinde.com/.well-known/jwks"));

app.post("/users/webhooks/kinde", async (c) => {
  try {
    const token = await c.req.text();
    const { payload } = await jwtVerify(token, KINDE_JWKS);

    if (payload.type === "user.deleted") {
      const userId = payload.data?.user?.id;
      if (userId) {
        const prisma = getPrismaClient(c);
        await prisma.user.delete({ where: { userId } }).catch(() => {
          // Ignore if user is already deleted or not found
        });
        console.log(`[user-svc] Webhook: deleted user ${userId}`);
      }
    }

    return c.json({ status: "ok" });
  } catch (error) {
    console.error("[user-svc] Webhook verification failed", error);
    return c.json({ error: "Invalid webhook token" }, 401);
  }
});

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
    rawToken: c.req.header("Authorization")?.split(" ")[1],
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
  console.log("[user-svc] ensureUser called:", { userId: authUser.userId, email: authUser.email, role: authUser.role });

  const existingUser = await loadUser(prisma, authUser.userId);
  if (existingUser) {
    if (existingUser.status === "banned" || existingUser.status === "inactive") {
      const error = new Error("Account is disabled");
      error.code = "ACCOUNT_DISABLED";
      throw error;
    }

    // Auto-update if email was a kinde.user placeholder and we now have the real email
    const hasPlaceholderEmail = existingUser.email.endsWith("@kinde.user");
    const hasRealEmail = authUser.email && !authUser.email.endsWith("@kinde.user");
    const hasDefaultName = existingUser.firstName === "MusicGear" || existingUser.lastName === "User";
    const tokenHasRealName = authUser.firstName !== "MusicGear" || authUser.lastName !== "User";

    if ((hasPlaceholderEmail && hasRealEmail) || (hasDefaultName && tokenHasRealName)) {
      console.log("[user-svc] Updating user profile info (email or name) from Kinde token");
      await prisma.user.update({
        where: { userId: existingUser.userId },
        data: {
          email: hasRealEmail ? authUser.email : existingUser.email,
          firstName: authUser.firstName !== "MusicGear" ? authUser.firstName : existingUser.firstName,
          lastName: authUser.lastName !== "User" ? authUser.lastName : existingUser.lastName,
        },
      });
      return loadUser(prisma, existingUser.userId);
    }

    console.log("[user-svc] Found existing user:", existingUser.userId);
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

    console.log("[user-svc] Found user by email:", existingByEmail.userId);
    // Link Kinde sub to this existing user
    if (existingByEmail.userId !== authUser.userId) {
      console.log("[user-svc] Updating userId to Kinde sub:", authUser.userId);
      await prisma.user.update({
        where: { userId: existingByEmail.userId },
        data: { userId: authUser.userId },
      });
      // Also update related tables
      await Promise.allSettled([
        prisma.customer.updateMany({ where: { customerId: existingByEmail.userId }, data: { customerId: authUser.userId } }),
        prisma.staff.updateMany({ where: { staffId: existingByEmail.userId }, data: { staffId: authUser.userId } }),
        prisma.admin.updateMany({ where: { adminId: existingByEmail.userId }, data: { adminId: authUser.userId } }),
      ]);
      return loadUser(prisma, authUser.userId);
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

  console.log("[user-svc] Creating new user:", authUser.userId, authUser.email, authUser.role);
  try {
    // 1. Create the base user
    await prisma.user.create({ data: createData });

    // 2. Create the associated role record sequentially (bypassing transaction limitation)
    if (authUser.role === "customer") {
      await prisma.customer.create({ data: { customerId: authUser.userId } });
    } else if (authUser.role === "admin") {
      await prisma.admin.create({ data: { adminId: authUser.userId } });
    } else if (authUser.role === "staff") {
      await prisma.staff.create({ data: { staffId: authUser.userId, position: "Unassigned" } });
    }

    console.log("[user-svc] User created successfully:", authUser.userId);
  } catch (createErr) {
    console.error("[user-svc] Failed to create user:", createErr?.message, createErr?.code);
    throw createErr;
  }

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

async function assignRoleSequentially(prisma, userId, role, position) {
  const user = await prisma.user.findUnique({
    where: { userId },
    include: { customer: true, staff: true, admin: true },
  });

  if (!user) {
    const error = new Error("User not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  await prisma.user.update({ where: { userId }, data: { role } });

  if (role === "customer") {
    if (!user.customer) {
      await prisma.customer.create({ data: { customerId: userId } });
    }
    if (user.staff) {
      await prisma.staff.delete({ where: { staffId: userId } });
    }
    if (user.admin) {
      await prisma.admin.delete({ where: { adminId: userId } });
    }
  } else if (role === "staff") {
    if (!user.staff) {
      await prisma.staff.create({ data: { staffId: userId, position: position || "Unassigned" } });
    } else if (position) {
      await prisma.staff.update({ where: { staffId: userId }, data: { position } });
    }
    if (user.admin) {
      await prisma.admin.delete({ where: { adminId: userId } });
    }
  } else if (role === "admin") {
    if (!user.admin) {
      await prisma.admin.create({ data: { adminId: userId } });
    }
    if (user.staff) {
      await prisma.staff.delete({ where: { staffId: userId } });
    }
  }

  return loadUser(prisma, userId);
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

    // If we have default fallback names, try to fetch real names from Kinde Profile API
    if (authUser.firstName === "MusicGear" || authUser.lastName === "User") {
      try {
        const profileRes = await fetch("https://musicgear.kinde.com/oauth2/v2/user_profile", {
          headers: { Authorization: `Bearer ${authUser.rawToken}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile.given_name) authUser.firstName = profile.given_name;
          if (profile.family_name) authUser.lastName = profile.family_name;
          if (profile.email) authUser.email = profile.email;
        }
      } catch (err) {
        console.error("[user-svc] Failed to fetch Kinde profile:", err);
      }
    }

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

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({ where: { userId: currentUser.userId }, data: userData });
    }

    if (Object.keys(customerData).length > 0) {
      if (authUser.role !== "customer") {
        throw Object.assign(new Error("Customer profile fields require customer role"), { code: "FORBIDDEN" });
      }

      await ensureCustomer(prisma, currentUser.userId);
      await prisma.customer.update({ where: { customerId: currentUser.userId }, data: customerData });
    }

    const updatedUser = await loadUser(prisma, currentUser.userId);

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

    const user = await assignRoleSequentially(prisma, userId, validation.data.role, validation.data.position);

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

    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.customerId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
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

    if (updates.isDefault) {
      await prisma.address.updateMany({
        where: { customerId: customer.customerId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
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

    await prisma.address.updateMany({
      where: { customerId: customer.customerId },
      data: { isDefault: false },
    });

    const address = await prisma.address.update({
      where: { addressId },
      data: { isDefault: true },
    });

    return c.json({ status: "ok", address });
  } catch (error) {
    return handleRouteError(c, error);
  }
});

export default app;
