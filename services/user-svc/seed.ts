import { Pool } from "@neondatabase/serverless";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".dev.vars")) {
  const envConfig = dotenv.parse(fs.readFileSync(".dev.vars"));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("No DATABASE_URL found");

  const pool = new Pool({ connectionString: dbUrl });
  console.log("Connected to DB.");

  // --- Thai dummy names for realistic data ---
  const thaiUsers = [
    { first: "สมชาย", last: "ใจดี", role: "customer" },
    { first: "สมหญิง", last: "รักเพลง", role: "customer" },
    { first: "กิตติ", last: "ดนตรี", role: "customer" },
    { first: "นภา", last: "เสียงดี", role: "customer" },
    { first: "ธนา", last: "วงศ์ดนตรี", role: "customer" },
    { first: "พิมพ์", last: "จิตร", role: "customer" },
    { first: "อนุ", last: "พาณิชย์", role: "customer" },
    { first: "วิภา", last: "สุขสม", role: "customer" },
    { first: "ชัย", last: "มงคล", role: "customer" },
    { first: "ลัดดา", last: "แก้วใส", role: "customer" },
    { first: "ทวี", last: "ผลดี", role: "customer" },
    { first: "รัตนา", last: "สวรรค์", role: "customer" },
    { first: "บัณฑิต", last: "ใฝ่รู้", role: "customer" },
    { first: "ศิริ", last: "ทองคำ", role: "customer" },
    { first: "เกียรติ", last: "ยศ", role: "customer" },
    { first: "ปิยะ", last: "นุช", role: "customer" },
    { first: "มนัส", last: "พรพระ", role: "customer" },
    { first: "จันทร์", last: "เพ็ญ", role: "customer" },
    { first: "สุรชัย", last: "เป็นไทย", role: "customer" },
    { first: "นวลจันทร์", last: "สดใส", role: "customer" },
    // Staff
    { first: "ธนพล", last: "ผู้จัดการ", role: "staff" },
    { first: "วรรณา", last: "พนักงาน", role: "staff" },
    { first: "ปิยวัฒน์", last: "คลัง", role: "staff" },
    // Admin
    { first: "Admin", last: "MusicGear", role: "admin" },
  ];

  console.log("Clearing existing users (cascade will handle related records)...");
  await pool.query('DELETE FROM "User"');
  console.log("Cleared.");

  console.log("Seeding users...");
  for (const u of thaiUsers) {
    const userId = `kp_seed_${crypto.randomBytes(8).toString("hex")}`;
    const email = `${u.first.toLowerCase().replace(/\s/g, "")}.${u.last.toLowerCase().replace(/\s/g, "")}@musicgear.dev`;
    const now = new Date().toISOString();

    // Insert User
    await pool.query(
      `INSERT INTO "User" ("userId", "email", "passwordHash", "firstName", "lastName", "role", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $7)
       ON CONFLICT DO NOTHING`,
      [userId, email, "", u.first, u.last, u.role, now]
    );

    // Insert related role record
    if (u.role === "customer") {
      await pool.query(
        `INSERT INTO "Customer" ("customerId", "createdAt", "updatedAt")
         VALUES ($1, $2, $2) ON CONFLICT DO NOTHING`,
        [userId, now]
      );
    } else if (u.role === "staff") {
      await pool.query(
        `INSERT INTO "Staff" ("staffId", "position", "createdAt", "updatedAt")
         VALUES ($1, 'Unassigned', $2, $2) ON CONFLICT DO NOTHING`,
        [userId, now]
      );
    } else if (u.role === "admin") {
      await pool.query(
        `INSERT INTO "Admin" ("adminId", "createdAt", "updatedAt")
         VALUES ($1, $2, $2) ON CONFLICT DO NOTHING`,
        [userId, now]
      );
    }

    console.log(`  ✓ ${u.role.toUpperCase()}: ${u.first} ${u.last} (${email})`);
  }

  console.log(`\nSeeding done! Inserted ${thaiUsers.length} users.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
