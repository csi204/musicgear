import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_CkXVgUoGvS69@ep-sparkling-leaf-a7utdbyk-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

async function main() {
  console.log('Clearing existing data...');
  await sql`DELETE FROM "DailySalesReport"`;
  await sql`DELETE FROM "ProductSalesSnapshot"`;
  await sql`DELETE FROM "InventorySnapshot"`;
  await sql`DELETE FROM "SystemAuditLog"`;

  console.log('Seeding DailySalesReport...');
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setUTCHours(0,0,0,0);
    const dateStr = d.toISOString();
    
    const revenue = Math.floor(Math.random() * 150000) + 50000;
    const orders = Math.floor(Math.random() * 20) + 5;
    
    await sql`
      INSERT INTO "DailySalesReport" (id, "reportDate", "totalOrders", "totalRevenue", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${dateStr}, ${orders}, ${revenue}, NOW())
    `;
  }

  console.log('Seeding ProductSalesSnapshot...');
  const products = [
    { name: 'กีต้าร์ Fender Stratocaster', category: 'Guitar', price: 45000 },
    { name: 'กีต้าร์ Gibson Les Paul', category: 'Guitar', price: 85000 },
    { name: 'กลอง Roland TD-17KVX', category: 'Drum', price: 62000 },
    { name: 'กลอง Yamaha Stage Custom', category: 'Drum', price: 35000 },
    { name: 'คีย์บอร์ด Nord Stage 3', category: 'Keyboard', price: 145000 },
    { name: 'เปียโน Yamaha P-145', category: 'Keyboard', price: 21000 },
    { name: 'ไมค์ Shure SM58', category: 'Microphone', price: 4200 },
    { name: 'ไมค์ Rode NT1-A', category: 'Microphone', price: 9500 },
    { name: 'แอมป์ Fender Blues Junior', category: 'Amp', price: 25000 },
    { name: 'แอมป์ Marshall JCM800', category: 'Amp', price: 75000 }
  ];

  for (const p of products) {
    const d = new Date(today);
    d.setUTCHours(0,0,0,0);
    const dateStr = d.toISOString();
    const qty = Math.floor(Math.random() * 50) + 5; 
    
    await sql`
      INSERT INTO "ProductSalesSnapshot" (id, "reportDate", "productId", "productName", "category", "quantitySold", "revenue", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${dateStr}, ${crypto.randomUUID()}, ${p.name}, ${p.category}, ${qty}, ${qty * p.price}, NOW())
    `;
  }

  console.log('Seeding InventorySnapshot...');
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let stock = 0;
    let status = 'In Stock';
    let reorder = 10;
    
    if (i < 2) {
      stock = Math.floor(Math.random() * 3); 
      status = 'Critical';
      reorder = 5;
    } else if (i < 5) {
      stock = Math.floor(Math.random() * 5) + 3; 
      status = 'Low';
      reorder = 15;
    } else {
      stock = Math.floor(Math.random() * 50) + 20; 
      status = 'In Stock';
      reorder = 10;
    }

    await sql`
      INSERT INTO "InventorySnapshot" (id, "productId", "productName", "category", "stockLevel", "reorderPoint", "status", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${crypto.randomUUID()}, ${p.name}, ${p.category}, ${stock}, ${reorder}, ${status}, NOW())
    `;
  }

  console.log('Seeding SystemAuditLog for stock movements...');
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    const logCount = Math.floor(Math.random() * 10) + 5;
    for (let j = 0; j < logCount; j++) {
      const logDate = new Date(d);
      logDate.setDate(Math.floor(Math.random() * 28) + 1);
      logDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
      
      const isStockIn = Math.random() > 0.4;
      const beforeQty = Math.floor(Math.random() * 50) + 10;
      const diff = Math.floor(Math.random() * 30) + 5;
      const afterQty = isStockIn ? beforeQty + diff : Math.max(0, beforeQty - diff);
      
      await sql`
        INSERT INTO "SystemAuditLog" ("logId", "eventType", "referenceId", "payload", "createdAt")
        VALUES (
          ${crypto.randomUUID()}, 
          'stock.updated', 
          ${crypto.randomUUID()}, 
          ${JSON.stringify({ beforeQty, afterQty })}, 
          ${logDate.toISOString()}
        )
      `;
    }
  }

  console.log('Seeding completed successfully!');
}

main().catch(console.error);
