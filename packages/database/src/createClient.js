import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

export function createPrismaClient(connectionString) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}