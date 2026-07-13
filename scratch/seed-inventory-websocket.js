import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const PRODUCT_DB_URL = "postgresql://neondb_owner:npg_WN6jHl2uPftE@ep-young-voice-a78sh0jj-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const INVENTORY_DB_URL = "postgresql://neondb_owner:npg_d0i6DgyhHlBw@ep-morning-star-a7t7upnm-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function run() {
  console.log("=== Fetching products from product-svc DB ===");
  try {
    const sqlProduct = neon(PRODUCT_DB_URL);
    const res = await sqlProduct.query('SELECT "productId", "name" FROM "Product" LIMIT 10');
    console.log("res structure:", typeof res, res);
  } catch (err) {
    console.error("Failed to fetch products:", err.message);
  }
}

run();
