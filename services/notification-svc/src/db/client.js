// Prisma Client v7 ใช้ import.meta.url เพื่อหา __dirname แต่ Cloudflare Workers ไม่มี
// ต้อง set globalThis.__dirname ก่อน import เพื่อไม่ให้ fileURLToPath ล้มเหลว
globalThis.__dirname ??= "";

import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * สร้าง Prisma client ต่อ 1 request
 * @param {string} connectionString — DATABASE_URL จาก c.env
 */
export function createClient(connectionString) {
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
