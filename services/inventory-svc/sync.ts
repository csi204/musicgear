import { createClient } from './src/db/client.js';

// ใช้ URL ของ inventory-svc ปัจจุบัน
const db = createClient("postgresql://neondb_owner:npg_PMts2Dr1uVZe@ep-morning-star-a7t7upnm-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

async function sync() {
  console.log("1. Fetching products from Product Service...");
  try {
    const res = await fetch("http://localhost:8794/api/products");
    const data = await res.json();
    const products = data.products || data || [];
    
    console.log(`Found ${products.length} products. Syncing to Inventory...`);
    
    let count = 0;
    for (const p of products) {
      const existing = await db.inventory.findUnique({ where: { productId: p.id } });
      if (!existing) {
        await db.inventory.create({
          data: {
            productId: p.id,
            quantity: 0,
            reservedQuantity: 0,
            reorderPoint: 5
          }
        });
        console.log(` - Created inventory for: ${p.productName}`);
        count++;
      }
    }
    
    console.log(`\n✅ Done! Synced ${count} new products to Inventory DB.`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

sync().finally(() => db.$disconnect());
