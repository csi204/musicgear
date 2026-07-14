import { SignJWT } from "jose";

async function main() {
  const secret = new TextEncoder().encode("a-very-secure-fallback-dev-secret-1234567890");
  const token = await new SignJWT({
    userId: "kp_seed_b226e6328ddf014e",
    email: "admin@test.com",
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const res = await fetch("https://musicgear-api-gateway.thunderwolf2209.workers.dev/users", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log(res.status, await res.text());
}

main();
