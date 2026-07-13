import { createClient } from './src/db/client.js';

const prisma = createClient('postgresql://neondb_owner:npg_HSFtO1TRQ5mp@ep-sparkling-leaf-a7utdbyk-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function clearDB() {
  console.log('Clearing report-svc database...');
  await prisma.inventorySnapshot.deleteMany();
  await prisma.dailySalesReport.deleteMany();
  await prisma.systemAuditLog.deleteMany();
  await prisma.productSalesSnapshot.deleteMany();
  console.log('Done clearing report-svc database!');
}

clearDB().catch(console.error).finally(() => prisma.$disconnect());
