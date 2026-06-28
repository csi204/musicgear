globalThis.__dirname = "";
globalThis.__filename = "";

import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * สร้าง Prisma client ต่อ 1 request
 * @param {string} connectionString
 */
export function createClient(connectionString) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
