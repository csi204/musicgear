// @ts-nocheck
// Use the locally generated Prisma client (Prisma 7 prisma-client generator)
// instead of @prisma/client which is not compatible with Cloudflare Workers.
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";

export function createPrismaClient(connectionString) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
