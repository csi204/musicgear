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

  console.log("Seeding DailySalesReport...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const totalOrders = 20 + Math.floor(Math.random() * 50);
    const totalRevenue = 5000 + Math.floor(Math.random() * 20000);

    await pool.query(`
      INSERT INTO "DailySalesReport" ("id", "reportDate", "totalOrders", "totalRevenue", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT ("reportDate") DO UPDATE 
      SET "totalOrders" = $3, "totalRevenue" = $4, "updatedAt" = NOW()
    `, [crypto.randomUUID(), dateStr, totalOrders, totalRevenue]);
  }

  console.log("Seeding ProductSalesSnapshot...");
  const products = [
    { name: "Fender Stratocaster", category: "Guitars" },
    { name: "Roland Jupiter-X", category: "Keyboards & Synths" },
    { name: "Shure SM7B", category: "Microphones" },
    { name: "Focusrite Scarlett 2i2", category: "Audio Interfaces" },
    { name: "Yamaha HS8", category: "Studio Monitors" },
  ];

  await pool.query('DELETE FROM "ProductSalesSnapshot"');

  for (const p of products) {
    const dateStr = today.toISOString().split('T')[0];
    const qty = 50 + Math.floor(Math.random() * 100);
    const rev = 10000 + Math.floor(Math.random() * 50000);

    await pool.query(`
      INSERT INTO "ProductSalesSnapshot" ("id", "reportDate", "productId", "productName", "category", "quantitySold", "revenue", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [crypto.randomUUID(), dateStr, crypto.randomUUID(), p.name, p.category, qty, rev]);
  }

  console.log("Seeding InventorySnapshot...");
  await pool.query('DELETE FROM "InventorySnapshot"');

  const alerts = [
    { name: "Gibson Les Paul Standard", stock: 2, status: "Critical" },
    { name: "Akai MPK Mini Mk3", stock: 5, status: "Low" },
    { name: "Audio-Technica ATH-M50x", stock: 8, status: "Low" },
    { name: "Korg Minilogue XD", stock: 1, status: "Critical" },
    { name: "Rode NT1-A", stock: 12, status: "Low" },
    { name: "Ableton Push 3", stock: 4, status: "Critical" },
    { name: "Yamaha Pacifica 112V", stock: 9, status: "Low" },
  ];

  for (const a of alerts) {
    await pool.query(`
      INSERT INTO "InventorySnapshot" ("id", "productId", "productName", "stockLevel", "status", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [crypto.randomUUID(), crypto.randomUUID(), a.name, a.stock, a.status]);
  }

  console.log("Seeding done.");
  await pool.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
