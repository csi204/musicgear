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
    const role = (c.get("user")?.role || "customer").toLowerCase();
    if (!normalizedRoles.includes(role)) {
      return c.json({ error: { code: "FORBIDDEN", message: "Insufficient role" } }, 403);
    }

    await next();
  };
}