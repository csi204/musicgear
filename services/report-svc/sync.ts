import { createClient } from './src/db/client.js';

// ใช้ URL ของ report-svc ปัจจุบัน (ep-sparkling-leaf)
const db = createClient("postgresql://neondb_owner:npg_HSFtO1TRQ5mp@ep-sparkling-leaf-a7utdbyk-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

async function sync() {
  console.log("1. Clearing old snapshot data...");
  await db.inventorySnapshot.deleteMany();
  
  console.log("2. Fetching products from Product Service...");
  try {
    const res = await fetch("http://localhost:8794/api/products");
    const data = await res.json();
    const products = data.products || data || [];
    
    console.log(`Found ${products.length} products. Rebuilding Report Snapshots...`);
    
    let count = 0;
    for (const p of products) {
      await db.inventorySnapshot.create({
        data: {
          productId: p.id,
          productName: p.productName,
          category: p.category || "Uncategorized",
          stockLevel: 0,
          reorderPoint: 5,
          status: "Critical"
        }
      });
      console.log(` - Created snapshot for: ${p.productName}`);
      count++;
    }
    
    console.log(`\n✅ Done! Rebuilt ${count} snapshots in Report DB.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

sync().finally(() => db.$disconnect());
