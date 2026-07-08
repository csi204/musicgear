/**
 * fetchProductSnapshot — ดึง productName และ category จาก product-svc
 * ใช้ก่อน publish `stock.updated` เพื่อ embed ข้อมูลครบในตัว event
 * (Snapshot pattern — report-svc ไม่ต้อง query ซ้ำเอง)
 *
 * ต้องมี env vars:
 *   PRODUCT_SVC_URL = https://product-svc.thunderwolf2209.workers.dev  (prod)
 *                   = http://localhost:8792  (dev, ใส่ใน .dev.vars)
 *
 * @param {object} env          — Cloudflare Worker env bindings (c.env)
 * @param {string} productId    — UUID ของสินค้าที่ต้องการดึง
 * @returns {Promise<{ productName: string; category: string } | null>}
 *   คืน null ถ้าไม่มี PRODUCT_SVC_URL หรือ call ไม่สำเร็จ (caller ใช้ fallback แทน)
 */
export async function fetchProductSnapshot(env, productId) {
  const productSvcUrl = env.PRODUCT_SVC_URL;

  if (!productSvcUrl) {
    console.warn("[fetchProductSnapshot] PRODUCT_SVC_URL not set — cannot fetch product details");
    return null;
  }

  try {
    const url = `${productSvcUrl.replace(/\/$/, "")}/products/${productId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[fetchProductSnapshot] product-svc returned ${res.status} for productId=${productId}`);
      return null;
    }

    const data = await res.json();
    return {
      productName: data.name ?? "Unknown",
      category: data.category?.name ?? "Uncategorized",
    };
  } catch (err) {
    console.error("[fetchProductSnapshot] Failed to fetch product details:", err);
    return null;
  }
}
