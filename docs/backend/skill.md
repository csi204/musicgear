# backend/skill.md — Backend Microservices (Hono + Cloudflare Workers)

> ใช้คู่กับ `structure.md` (path ของแต่ละ service) และ `design.md` (เหตุผลเชิงสถาปัตยกรรม) — ไฟล์นี้เน้นกฎการเขียนโค้ดฝั่ง backend โดยเฉพาะ

## Stack

Hono บน Cloudflare Workers, Prisma + adapter-neon ต่อ Neon PostgreSQL, Zod validation, Kinde JWT auth, Omise payment, Upstash Redis (cart) + Upstash QStash (event)

## 1. โครงสร้างมาตรฐานต่อ 1 service

ดู path เต็มใน `structure.md` — ทุก service ต้องมี layer แยกชัดเจน: `routes` (รับ request) → `services` (business logic) → `db` (query) ห้ามยัด query ตรงๆ ใน route handler

## 2. Validation

ทุก endpoint ต้อง validate request body/query ด้วย Zod schema จาก `packages/types` ก่อนเข้าสู่ business logic

```ts
app.post("/inventory/receive", zValidator("json", receiveStockSchema), async (c) => {
  const { productId, qty } = c.req.valid("json");
  // ...
});
```

## 3. Error Response มาตรฐาน

ทุก service คืน error shape เดียวกัน เพื่อให้ frontend handle ได้แบบเดียวทั้งระบบ

```json
{ "error": { "code": "OUT_OF_STOCK", "message": "สินค้าคงเหลือไม่เพียงพอ" } }
```

| HTTP Status | ใช้เมื่อ |
|---|---|
| 400 | validation fail |
| 401 | ไม่มี/หมดอายุ token |
| 403 | role ไม่มีสิทธิ์ (RBAC) |
| 404 | ไม่พบ resource |
| 409 | conflict เช่น สต็อกไม่พอตอน checkout |
| 500 | server error |

## 4. Auth Middleware

ทุก service ต้องมี middleware เดียวกัน 2 ชั้น (ใช้ shared middleware จาก `packages` ไม่เขียนซ้ำ):
1. `verifyKindeToken` — เช็ค JWT valid
2. `requireRole(["admin"])` — เช็คสิทธิ์ตาม role ตามตาราง RBAC ใน `design.md` (อย่าเชื่อ role ที่ frontend ส่งมา ต้อง decode จาก JWT เท่านั้น)

## 5. กฎการแก้ Inventory (ห้ามฝ่าฝืน)

ห้าม `UPDATE inventory SET quantity = ...` ตรงๆ ที่ไหนก็ตาม ทุกการแก้ไขต้องผ่านฟังก์ชันกลาง `adjustStock()` ใน `inventory.service.ts` ที่ทำ 2 อย่างพร้อมกันเสมอใน 1 transaction:

```ts
async function adjustStock(productId: string, changeQty: number, action: InventoryAction, staffId?: string) {
  // 1. update inventory.quantity
  // 2. insert inventory_logs (beforeQty, afterQty, changeQty, action, staffId)
  // 3. ถ้า beforeQty === 0 && afterQty > 0 → publishEvent("stock.updated", {...})
}
```

## 6. Event Publishing (Upstash QStash)

Service ที่ publish event (product-svc, order-svc, payment-svc) เรียกผ่าน helper กลาง ไม่ยิง QStash REST API ตรงๆ กระจายในหลายที่

```ts
// packages/database หรือ shared util
async function publishEvent(event: string, payload: object) {
  await fetch(`${QSTASH_URL}/v2/publish/${NOTIFICATION_WEBHOOK_URL}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${QSTASH_TOKEN}` },
    body: JSON.stringify({ event, ...payload }),
  });
}
```

`notification-svc` รับทุก event ผ่าน webhook endpoint เดียว `/webhooks/qstash` แล้ว switch ตาม `event` field เอง — service ต้นทางไม่ต้องรู้จัก logic การแจ้งเตือนเลย

Event ที่มีอยู่: `stock.updated`, `order.status_changed`, `payment.success` (รายละเอียด payload เต็มอยู่ใน `design.md` หัวข้อ 5)

## 7. Inter-service Communication

- **Sync (REST ผ่าน API Gateway)** — ใช้เมื่อต้องการผลลัพธ์ทันทีในขั้นตอนนั้น เช่น `order-svc` เช็คสต็อกกับ `product-svc` ตอน checkout
- **Async (QStash event)** — ใช้เมื่อเป็น side-effect ที่ไม่ต้องรอผล เช่น แจ้งเตือนลูกค้า, อัปเดตยอด report

อย่าใช้ sync call สำหรับ side-effect (จะทำให้ checkout ช้าโดยไม่จำเป็น) และอย่าใช้ async event สำหรับสิ่งที่ต้องรู้ผลทันที (เช่น เช็คสต็อกก่อนตัดเงิน)

## 8. Database Migration

แต่ละ service มี `drizzle.config.ts` และ migration ของตัวเอง รันแยกกัน ห้าม migration ของ service หนึ่งไปแก้ schema namespace ของ service อื่น

## 9. Testing ขั้นต่ำ

โปรเจกต์นี้ใช้ UAT (manual testing) เป็นหลักตาม Testing Approach ของกลุ่ม — แต่ยังต้องพึ่ง type-safety เป็นด่านแรก: ทุก endpoint ต้องผ่าน Zod schema และ TypeScript strict mode ก่อน merge เป็นอย่างน้อย ไม่ต้องเขียน unit test เพิ่มถ้าเวลาไม่พอ แต่ต้อง type-check ผ่านเสมอ
