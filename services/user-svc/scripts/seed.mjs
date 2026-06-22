import { neon } from "../../../packages/database/node_modules/@neondatabase/serverless/index.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadDatabaseUrl() {
  const devVarsPath = join(__dirname, "../.dev.vars");
  const raw = readFileSync(devVarsPath, "utf8");
  const match = raw.match(/DATABASE_URL="([^"]+)"/);
  if (!match) {
    throw new Error("DATABASE_URL not found in .dev.vars");
  }

  return match[1];
}

const testUsers = [
  {
    userId: "10000000-0000-4000-8000-000000000001",
    email: "customer@musicgear.test",
    firstName: "Somchai",
    lastName: "Customer",
    phone: "0811111111",
    role: "customer",
    password: "MusicGear@Customer1",
  },
  {
    userId: "10000000-0000-4000-8000-000000000002",
    email: "admin@musicgear.test",
    firstName: "Admin",
    lastName: "MusicGear",
    phone: "0822222222",
    role: "admin",
    password: "MusicGear@Admin1",
  },
  {
    userId: "10000000-0000-4000-8000-000000000003",
    email: "staff@musicgear.test",
    firstName: "Staff",
    lastName: "Warehouse",
    phone: "0833333333",
    role: "staff",
    position: "Warehouse / Packing",
    password: "MusicGear@Staff1",
  },
];

const sql = neon(loadDatabaseUrl());

async function seed() {
  console.log("Pushing schema tables if missing...");

  await sql`
    CREATE TABLE IF NOT EXISTS "User" (
      "userId" UUID PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "phone" TEXT,
      "role" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Customer" (
      "customerId" UUID PRIMARY KEY,
      "dateOfBirth" DATE,
      "gender" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Staff" (
      "staffId" UUID PRIMARY KEY,
      "position" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Admin" (
      "adminId" UUID PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "Address" (
      "addressId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "customerId" UUID NOT NULL,
      "receiverName" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "addressLine1" TEXT NOT NULL,
      "addressLine2" TEXT,
      "province" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "postalCode" TEXT NOT NULL,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  for (const user of testUsers) {
    await sql`
      INSERT INTO "User" (
        "userId", "email", "passwordHash", "firstName", "lastName", "phone", "role", "status"
      ) VALUES (
        ${user.userId}::uuid,
        ${user.email},
        '',
        ${user.firstName},
        ${user.lastName},
        ${user.phone},
        ${user.role},
        'active'
      )
      ON CONFLICT ("email") DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        "phone" = EXCLUDED."phone",
        "role" = EXCLUDED."role",
        "status" = 'active',
        "updatedAt" = CURRENT_TIMESTAMP
    `;

    if (user.role === "customer") {
      await sql`
        INSERT INTO "Customer" ("customerId")
        VALUES (${user.userId}::uuid)
        ON CONFLICT ("customerId") DO NOTHING
      `;
    }

    if (user.role === "staff") {
      await sql`
        INSERT INTO "Staff" ("staffId", "position")
        VALUES (${user.userId}::uuid, ${user.position})
        ON CONFLICT ("staffId") DO UPDATE SET
          "position" = EXCLUDED."position",
          "updatedAt" = CURRENT_TIMESTAMP
      `;
    }

    if (user.role === "admin") {
      await sql`
        INSERT INTO "Admin" ("adminId")
        VALUES (${user.userId}::uuid)
        ON CONFLICT ("adminId") DO NOTHING
      `;
    }

    console.log(`Seeded ${user.role}: ${user.email}`);
  }

  const customerId = testUsers[0].userId;
  await sql`
    INSERT INTO "Address" (
      "addressId",
      "customerId",
      "receiverName",
      "phone",
      "addressLine1",
      "province",
      "city",
      "postalCode",
      "isDefault"
    ) VALUES (
      '20000000-0000-4000-8000-000000000001'::uuid,
      ${customerId}::uuid,
      'Somchai Customer',
      '0811111111',
      '123 Test Street',
      'Bangkok',
      'Bangkok',
      '10110',
      true
    )
    ON CONFLICT ("addressId") DO NOTHING
  `;

  console.log("Seed completed.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
