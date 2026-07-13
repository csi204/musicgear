import pg from "pg";

const PRODUCT_DB_URL = "postgresql://neondb_owner:npg_WN6jHl2uPftE@ep-young-voice-a78sh0jj-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const INVENTORY_DB_URL = "postgresql://neondb_owner:npg_d0i6DgyhHlBw@ep-morning-star-a7t7upnm-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
  console.log("=== Fetching products from product-svc DB ===");
  const productClient = new pg.Client({
    connectionString: PRODUCT_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  
  let products = [];
  try {
    await productClient.connect();
    const res = await productClient.query('SELECT "productId", "name" FROM "Product" LIMIT 10');
    products = res.rows;
    console.log(`Fetched ${products.length} products:`);
    products.forEach(p => console.log(`- ${p.productId}: ${p.name}`));
  } catch (err) {
    console.error("Failed to fetch products:", err.message);
    return;
  } finally {
    await productClient.end();
  }

  if (products.length === 0) {
    console.log("No products found in product-svc DB.");
    return;
  }

  console.log("\n=== Seeding Inventory DB ===");
  const inventoryClient = new pg.Client({
    connectionString: INVENTORY_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await inventoryClient.connect();
    
    // Create Table check just in case
    console.log("Ensuring Inventory table exists and seeding stock...");
    
    for (const p of products) {
      // Check if stock already exists
      const checkRes = await inventoryClient.query(
        'SELECT * FROM "Inventory" WHERE "productId" = $1',
        [p.productId]
      );
      
      if (checkRes.rows.length > 0) {
        console.log(`Stock already exists for product: ${p.name} (${p.productId}). Updating qty to 50.`);
        await inventoryClient.query(
          'UPDATE "Inventory" SET "quantity" = 50, "reservedQuantity" = 0, "updatedAt" = NOW() WHERE "productId" = $1',
          [p.productId]
        );
      } else {
        console.log(`Creating stock = 50 for product: ${p.name} (${p.productId})`);
        await inventoryClient.query(
          'INSERT INTO "Inventory" ("inventoryId", "productId", "quantity", "reservedQuantity", "updatedAt") VALUES (gen_random_uuid(), $1, 50, 0, NOW())',
          [p.productId]
        );
      }
    }
    
    console.log("Successfully seeded stock for all products!");
  } catch (err) {
    console.error("Failed to seed inventory:", err.message);
  } finally {
    await inventoryClient.end();
  }
}

run();
