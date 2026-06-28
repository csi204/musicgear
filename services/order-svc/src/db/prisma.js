import pkg from "../../generated/prisma/edge.js";
import { PrismaNeon } from "@prisma/adapter-neon";

const { PrismaClient } = pkg;

export function createPrisma(databaseUrl) {
  // Clean connection string (remove quotes if any)
  const cleanString = databaseUrl.replace(/^["']|["']$/g, "").trim();
  
  // Initialize PrismaNeon with connectionString directly (the official Prisma Neon adapter configuration)
  const adapter = new PrismaNeon({ connectionString: cleanString });
  
  return new PrismaClient({ adapter });
}
