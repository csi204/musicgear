// @ts-nocheck
// Use the locally generated Prisma client (Prisma 7 prisma-client generator)
// instead of @prisma/client which is not compatible with Cloudflare Workers.
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaNeonHttp } from "@prisma/adapter-neon";

export function createPrismaClient(connectionString) {
  const cleanString = connectionString.replace(/^["']|["']$/g, "").trim();

  console.log("[createClient] Initializing Prisma with connectionString:", cleanString ? "SET" : "UNDEFINED");

  const adapter = new PrismaNeonHttp(cleanString, { fetchOptions: { cache: 'no-store' } });
  return new PrismaClient({ adapter });
}
