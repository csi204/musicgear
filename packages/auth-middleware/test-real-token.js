import { SignJWT } from "jose";

async function main() {
  const secret = new TextEncoder().encode("K9xL2pQ8mF4vC1nB7zH3jR5wT6yN0kM4");
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
