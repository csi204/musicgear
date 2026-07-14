import { jwtVerify } from "jose";

export function createAuthMiddleware(options = {}) {
  return async function verifyToken(c, next) {
    const authHeader = c.req.header("Authorization");
    const m2mHeader = c.req.header("x-api-key");

    // Support M2M with INTERNAL_API_KEY
    if (m2mHeader && c.env.INTERNAL_API_KEY && m2mHeader === c.env.INTERNAL_API_KEY) {
      c.set("user", {
        userId: "m2m-admin",
        role: "admin",
        gty: ["client_credentials"],
      });
      return await next();
    }

    if (!authHeader) {
      return c.json({ error: { code: "UNAUTHORIZED", message: "Missing token" } }, 401);
    }

    const [scheme, token] = authHeader.trim().split(/\s+/, 2);
    if (!token || scheme.toLowerCase() !== "bearer") {
      return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid format" } }, 401);
    }

    // Support local testing with Mock Token
    if (token.startsWith("mock-")) {
      try {
        const base64Part = token.substring(5);
        const rawJson = atob(base64Part.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(rawJson);
        c.set("user", payload);
        return await next();
      } catch (err) {
        console.error("[auth-middleware] Invalid mock token:", err);
        return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid mock token format" } }, 401);
      }
    }

    try {
      const secretStr = c.env.NEXTAUTH_SECRET || c.env.AUTH_SECRET || "fallback-dev-secret-1234567890";
      console.log("[verifyToken] Using secret of length:", secretStr.length, "StartsWith:", secretStr.substring(0, 3));
      const secret = new TextEncoder().encode(secretStr);
      const { payload } = await jwtVerify(token, secret);
      c.set("user", payload);
      await next();
    } catch (err) {
      console.error("[verifyToken] Error:", err.message, err.stack);
      return c.json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } }, 401);
    }
  };
}

export function createRoleMiddleware(allowedRoles) {
  const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());

  return async function requireRole(c, next) {
    const user = c.get("user");

    // Allow M2M tokens to bypass role checks (act as root/admin)
    if (user?.gty && user.gty.includes("client_credentials")) {
      return await next();
    }

    const roleKey = Array.isArray(user?.roles) ? user?.roles[0]?.key : null;
    const flatRole = user?.role;
    const rawRole = roleKey || flatRole || "customer";
    const role = String(rawRole).toLowerCase();
    
    if (!normalizedRoles.includes(role)) {
      return c.json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }, 403);
    }

    await next();
  };
}