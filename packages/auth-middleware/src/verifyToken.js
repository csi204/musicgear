import { createRemoteJWKSet, jwtVerify } from "jose";

function normalizeKindeDomain(kindeDomain) {
  if (!kindeDomain) {
    throw new Error("kindeDomain is required");
  }

  return kindeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function createAuthMiddleware(kindeDomain, options = {}) {
  const normalizedDomain = normalizeKindeDomain(kindeDomain);
  const issuer = `https://${normalizedDomain}`;
  const JWKS = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks`));

  return async function verifyToken(c, next) {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
    }

    const [scheme, token] = authHeader.trim().split(/\s+/, 2);
    if (!token || scheme.toLowerCase() !== "bearer") {
      return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
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
      const verifyOptions = { issuer };
      if (options.clientId) {
        verifyOptions.audience = options.clientId;
      }

      const { payload } = await jwtVerify(token, JWKS, verifyOptions);
      c.set("user", payload);
      await next();
    } catch {
      return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
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

    const role = (user?.role || "customer").toLowerCase();
    if (!normalizedRoles.includes(role)) {
      return c.json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }, 403);
    }

    await next();
  };
}