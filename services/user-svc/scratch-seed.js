import { createPrismaClient } from "./src/createClient.js";
import bcrypt from "bcryptjs";

const DATABASE_URL = "postgresql://neondb_owner:npg_9cyzOrm1NtAX@ep-bold-fog-a7rac7jj-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const prisma = createPrismaClient(DATABASE_URL);
  const passwordHash = bcrypt.hashSync("password123", 10);

  // 1. Create Admin
  let admin = await prisma.user.findUnique({ where: { email: "admin@musicgear.com" } });
  if (admin) {
    admin = await prisma.user.update({
      where: { email: "admin@musicgear.com" },
      data: { passwordHash, role: "admin" }
    });
  } else {
    admin = await prisma.user.create({
      data: {
        email: "admin@musicgear.com",
        passwordHash,
        firstName: "Super",
        lastName: "Admin",
        role: "admin",
        status: "active",
      }
    });
  }
  console.log("Admin created:", admin.email);

  const existingAdminProfile = await prisma.admin.findUnique({ where: { adminId: admin.userId } });
  if (!existingAdminProfile) {
    await prisma.admin.create({ data: { adminId: admin.userId } });
  }

  // 2. Create Staff
  let staff = await prisma.user.findUnique({ where: { email: "staff@musicgear.com" } });
  if (staff) {
    staff = await prisma.user.update({
      where: { email: "staff@musicgear.com" },
      data: { passwordHash, role: "staff" }
    });
  } else {
    staff = await prisma.user.create({
      data: {
        email: "staff@musicgear.com",
        passwordHash,
        firstName: "Sales",
        lastName: "Staff",
        role: "staff",
        status: "active",
      }
    });
  }
  console.log("Staff created:", staff.email);

  const existingStaffProfile = await prisma.staff.findUnique({ where: { staffId: staff.userId } });
  if (!existingStaffProfile) {
    await prisma.staff.create({ data: { staffId: staff.userId, position: "Sales Representative" } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
