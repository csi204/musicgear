globalThis.__dirname = "";
globalThis.__filename = "";

import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

/**
 * สร้าง Prisma client ต่อ 1 request
 * @param {string} connectionString
 */
export function createClient(connectionString) {
  const cleanString = connectionString.replace(/^["']|["']$/g, "").trim();
  const adapter = new PrismaNeonHttp(cleanString, { fetchOptions: { cache: 'no-store' } });
  return new PrismaClient({ adapter });
}
