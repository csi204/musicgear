import { jwtVerify, createRemoteJWKSet } from "jose";

export function createAuthMiddleware(kindeDomain) {
  const JWKS = createRemoteJWKSet(new URL(`https://${kindeDomain}/.well-known/jwks`));

  return async function verifyToken(c, next) {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ error: { code: "UNAUTHORIZED" } }, 401);

    try {
      const token = authHeader.replace("Bearer ", "");
      const { payload } = await jwtVerify(token, JWKS);
      c.set("user", payload); // มี role, sub (userId), email
      await next();
    } catch {
      return c.json({ error: { code: "UNAUTHORIZED" } }, 401);
    }
  };
}