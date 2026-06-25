/**
 * Publish `stock.updated` event ไปยัง QStash
 * เรียกเมื่อ quantity ของสินค้าตัวใดตัวหนึ่งลดเหลือ 0 หลัง sale-deduct
 *
 * ต้องมี env vars ใน .dev.vars / wrangler.jsonc:
 *   QSTASH_URL   = https://qstash.upstash.io
 *   QSTASH_TOKEN = <token จาก Upstash console>
 *   NOTIFICATION_SVC_URL = http://localhost:8791  (ตอน dev)
 *
 * @param {object} env   — Cloudflare Worker env bindings (c.env)
 * @param {string} productId
 * @param {number} beforeQty
 * @param {number} afterQty
 */
export async function publishStockUpdated(env, productId, beforeQty, afterQty) {
  const qstashUrl = env.QSTASH_URL;
  const qstashToken = env.QSTASH_TOKEN;
  const subscriberUrl = `${env.NOTIFICATION_SVC_URL}/webhooks/qstash`;

  if (!qstashUrl || !qstashToken || !env.NOTIFICATION_SVC_URL) {
    console.warn("[publishStockUpdated] QSTASH_URL / QSTASH_TOKEN / NOTIFICATION_SVC_URL not set — skipping publish");
    return;
  }

  const payload = {
    event: "stock.updated",
    productId,
    beforeQty,
    afterQty,
  };

  const res = await fetch(`${qstashUrl}/v2/publish/${encodeURIComponent(subscriberUrl)}`, {
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
  }
}
