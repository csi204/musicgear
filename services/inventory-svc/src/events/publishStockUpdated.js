/**
 * Publish `stock.updated` event ไปยัง QStash
 * เรียกเมื่อ quantity ของสินค้าตัวใดตัวหนึ่งเปลี่ยนแปลง (sale-deduct / adjust)
 *
 * ต้องมี env vars ใน .dev.vars / wrangler.jsonc:
 *   QSTASH_URL            = https://qstash.upstash.io
 *   QSTASH_TOKEN          = <token จาก Upstash console>
 *   NOTIFICATION_SVC_URL  = http://localhost:8791  (ตอน dev)
 *   REPORT_SVC_URL        = http://localhost:8798  (ตอน dev) — เพิ่มใหม่
 *
 * @param {object} env   — Cloudflare Worker env bindings (c.env)
 * @param {string} productId
 * @param {number} beforeQty
 * @param {number} afterQty
 * @param {{ productName: string; category: string; stockLevel: number; reorderPoint: number; status: "In Stock" | "Low" | "Critical" }} snapshot
 *        — ข้อมูล Snapshot ที่ report-svc ต้องการสำหรับอัปเดต InventorySnapshot
 */
export async function publishStockUpdated(env, productId, beforeQty, afterQty, snapshot) {
  const qstashUrl = env.QSTASH_URL;
  const qstashToken = env.QSTASH_TOKEN;

  if (!qstashUrl || !qstashToken) {
    console.warn("[publishStockUpdated] QSTASH_URL / QSTASH_TOKEN not set — skipping publish");
    return;
  }

  // รวม subscriber URLs ทั้ง notification-svc และ report-svc (fan-out ด้วย QStash Topic หรือ publish ทีละตัว)
  const subscribers = [];
  if (env.NOTIFICATION_SVC_URL) {
    subscribers.push(`${env.NOTIFICATION_SVC_URL.replace(/\/$/, "")}/webhooks/qstash`);
  }
  if (env.REPORT_SVC_URL) {
    subscribers.push(`${env.REPORT_SVC_URL.replace(/\/$/, "")}/webhooks/qstash`);
  }

  if (subscribers.length === 0) {
    console.warn("[publishStockUpdated] No subscriber URLs configured — skipping publish");
    return;
  }

  const payload = {
    event: "stock.updated",
    productId,
    beforeQty,
    afterQty,
    // Snapshot fields สำหรับ report-svc อัปเดต InventorySnapshot โดยไม่ต้อง query ซ้ำ
    productName: snapshot?.productName ?? "Unknown",
    category: snapshot?.category ?? "Uncategorized",
    stockLevel: snapshot?.stockLevel ?? afterQty,
    reorderPoint: snapshot?.reorderPoint ?? 0,
    status: snapshot?.status ?? (afterQty === 0 ? "Critical" : afterQty <= 5 ? "Low" : "In Stock"),
  };

  // ถ้ารันบน Local (http://localhost:8080) ให้ยิง Webhook ตรงๆ เลยเพื่อลดปัญหา
  const isLocal = !qstashUrl || !qstashToken || qstashUrl.includes("localhost");

  await Promise.all(subscribers.map(async (subscriberUrl) => {
    if (isLocal) {
      console.info(`[publishStockUpdated] Local Dev Mode: Direct webhook to ${subscriberUrl}`);
      try {
        const res = await fetch(subscriberUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) console.error(`[publishStockUpdated] Direct webhook error: ${res.status}`);
      } catch (err) {
        console.error(`[publishStockUpdated] Direct webhook failed:`, err.message);
      }
    } else {
      console.info(`[publishStockUpdated] Publishing stock.updated to QStash: ${subscriberUrl}`);
      try {
        const res = await fetch(`${qstashUrl}/v2/publish/${subscriberUrl}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const text = await res.text();
          console.error(`[publishStockUpdated] QStash error ${res.status}: ${text}`);
        } else {
          console.info(`[publishStockUpdated] Event published successfully to ${subscriberUrl}`);
        }
      } catch (err) {
        console.error(`[publishStockUpdated] QStash publish failed:`, err);
      }
    }
  }));
}
