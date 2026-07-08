# 🤝 API Contract — บุญ ↔ เดียร์

> เอกสารนี้คือข้อตกลงระหว่าง **บุญ** (cart/order/payment) และ **เดียร์** (product/inventory/notification)
> ทั้งคู่ต้องอ่านและ **เห็นด้วยก่อน** ถึงจะเริ่มเขียนโค้ดในส่วนที่ขึ้นกันได้ เมื่อตกลงแล้วห้ามเปลี่ยน request/response shape โดยไม่แจ้งอีกฝ่ายก่อน

---

## 📌 ภาพรวมจุดที่ต้องประสานกัน

```
บุญ (order-svc)
  │
  ├─── [1] ต้องการเช็คว่าสินค้ามีสต็อกพอมั้ย ──────► เดียร์ (inventory-svc)
  │
  ├─── [2] ต้องการจองสต็อกก่อนชำระเงิน ──────────► เดียร์ (inventory-svc)
  │
  ├─── [3] ถ้า payment fail → ต้องคืนสต็อก ───────► เดียร์ (inventory-svc)
  │
  └─── [4] เมื่อ order/payment เสร็จ → publish event ► เดียร์ (notification-svc รับ)

เดียร์ (product-svc)
  │
  └─── [5] ต้องการข้อมูล order เพื่อแสดงใน Staff Portal ► บุญ (order-svc)
```

---

## 🔵 Contract 1 — เช็คสต็อก (บุญเรียก → เดียร์ตอบ)

**บุญเรียกตอน:** ลูกค้ากด Checkout ก่อนสร้าง Order (เพื่อตรวจว่าสินค้าทุกตัวในตะกร้ามีสต็อกพอ)

### Endpoint ที่เดียร์ต้องสร้าง

```
POST /stock/check
```

> ใช้ POST เพราะส่ง array ของ items มา (ไม่เหมาะกับ GET query params)

### Request (บุญส่งไป)

```json
{
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

### Response — สำเร็จ (เดียร์ตอบ)

```json
{
  "available": true,
  "items": [
    { "productId": "uuid", "quantity": 2, "currentStock": 10, "ok": true },
    { "productId": "uuid", "quantity": 1, "currentStock": 5,  "ok": true }
  ]
}
```

### Response — สต็อกไม่พอ (HTTP 409)

```json
{
  "available": false,
  "items": [
    { "productId": "uuid", "quantity": 2, "currentStock": 10, "ok": true },
    { "productId": "uuid", "quantity": 5, "currentStock": 2,  "ok": false }
  ]
}
```

> ⚠️ **บุญต้องรู้**: ถ้า `available = false` ให้ reject สร้าง Order ทันที ไม่ต้องเรียกข้อ 2 และแสดง error ให้ลูกค้าเห็นว่าสินค้าตัวไหนไม่พอ

---

## 🔵 Contract 2 — จองสต็อก / Reserve (บุญเรียก → เดียร์ตอบ)

**บุญเรียกตอน:** สร้าง Order สำเร็จแล้ว กำลังจะไป Payment (ล็อคของไว้ก่อนตัดเงิน)

### Endpoint ที่เดียร์ต้องสร้าง

```
POST /stock/reserve
```

### Request (บุญส่งไป)

```json
{
  "orderId": "uuid",
  "items": [
    { "productId": "uuid", "quantity": 2 },
    { "productId": "uuid", "quantity": 1 }
  ]
}
```

### Response — สำเร็จ (HTTP 200)

```json
{
  "reserved": true,
  "orderId": "uuid"
}
```

### Response — จองไม่ได้ (HTTP 409) — อาจเกิดถ้าสต็อกหมดระหว่างที่กำลัง process

```json
{
  "reserved": false,
  "orderId": "uuid",
  "reason": "INSUFFICIENT_STOCK",
  "failedItems": [
    { "productId": "uuid", "requested": 2, "available": 1 }
  ]
}
```

> **เดียร์ต้องรู้**: ตอน reserve ต้องทำใน inventory-svc โดย:
> 1. เพิ่ม `reservedQuantity` ใน `Inventory` table
> 2. insert `InventoryLog` ด้วย `action = reserve`
> 3. ต้องเป็น atomic (transaction เดียวกัน) ป้องกัน race condition

---

## 🔵 Contract 3 — คืนสต็อก / Release (บุญเรียก → เดียร์ตอบ)

**บุญเรียกตอน:** Payment ล้มเหลว หรือ Order ถูก cancel ก่อนชำระเงิน

### Endpoint ที่เดียร์ต้องสร้าง

```
POST /stock/release
```

### Request (บุญส่งไป)

```json
{
  "orderId": "uuid"
}
```

> เดียร์ต้องใช้ `orderId` ไปค้นหาว่า reserve ไว้อะไรบ้าง (ต้องเก็บ orderId ไว้ใน `InventoryLog` หรือ table แยก)

### Response — สำเร็จ (HTTP 200)

```json
{
  "released": true,
  "orderId": "uuid"
}
```

> **เดียร์ต้องรู้**: ตอน release ต้องทำ:
> 1. ลด `reservedQuantity` ใน `Inventory` table
> 2. insert `InventoryLog` ด้วย `action = release`
>
> ⚠️ **บุญต้องรู้**: ต้องเรียก release ใน 2 กรณี:
> - Payment สร้างแล้ว status = `failed`
> - Order ถูก cancel โดยลูกค้า (ก่อนชำระ)

---

## 🔵 Contract 4 — ตัดสต็อกจริง / Sale Deduct (บุญเรียก → เดียร์ตอบ)

**บุญเรียกตอน:** Payment สำเร็จแล้ว (status = `paid`) ตัดสต็อกจริงออก

### Endpoint ที่เดียร์ต้องสร้าง

```
POST /stock/sale-deduct
```

### Request (บุญส่งไป)

```json
{
  "orderId": "uuid"
}
```

### Response — สำเร็จ (HTTP 200)

```json
{
  "deducted": true,
  "orderId": "uuid"
}
```

> **เดียร์ต้องรู้**: ตอน sale-deduct ต้องทำ:
> 1. ลด `quantity` ใน `Inventory` table
> 2. ลด `reservedQuantity` (release ที่ reserve ไว้)
> 3. insert `InventoryLog` ด้วย `action = sale_deduct`
>
> ⚠️ ถ้า `quantity` หลัง deduct = 0 → เดียร์ต้อง publish `stock.updated` event ผ่าน QStash เอง (ดู `packages/types/src/events.js`)

---

## 🟠 Contract 5 — Events ที่บุญ Publish ให้เดียร์รับ

> Events เหล่านี้ **บุญ publish** ผ่าน QStash → **เดียร์รับ** ผ่าน `notification-svc`
> Schema อยู่ใน `packages/types/src/events.js` แล้ว ห้ามเปลี่ยน shape

### Event 1: `order.status_changed`

**บุญ publish เมื่อ**: Order status เปลี่ยนทุกครั้ง (confirmed, packed, shipped, delivered, cancelled, refunded)

```js
// จาก packages/types/src/events.js
{
  event: "order.status_changed",
  orderId: "uuid",
  customerId: "uuid",
  status: "confirmed" // | "packed" | "shipped" | "delivered" | "cancelled" | "refunded"
}
```

### Event 2: `payment.success`

**บุญ publish เมื่อ**: Omise ตอบ success และบันทึก Payment.status = paid สำเร็จ

```js
// จาก packages/types/src/events.js
{
  event: "payment.success",
  orderId: "uuid",
  customerId: "uuid"
}
```

> **เดียร์ต้องรู้**: `notification-svc` ต้องมี endpoint `/webhooks/qstash` รับทั้ง 2 events นี้
> ดู path ใน `packages/types/src/events.js` → `QSTASH_SUBSCRIBERS.notificationSvc`

---

## 🟢 Contract 6 — ข้อมูลสินค้าที่บุญต้องแสดงใน Order (เดียร์ต้องให้ endpoint)

**บุญต้องการตอน**: แสดงหน้า Order Detail ว่าลูกค้าสั่งสินค้าอะไรบ้าง (ชื่อสินค้า, รูป)

### Endpoint ที่เดียร์ต้องมี (อาจมีอยู่แล้ว)

```
GET /products/:productId
```

### Response ที่บุญต้องการ (อย่างน้อย)

```json
{
  "productId": "uuid",
  "name": "กีต้าร์ Fender Stratocaster",
  "slug": "fender-stratocaster-2024",
  "price": 45000.00,
  "images": [
    { "imageUrl": "https://...", "isPrimary": true, "sortOrder": 0 }
  ]
}
```

> **บุญต้องรู้**: `OrderItem` เก็บแค่ `productId` ไม่ได้เก็บ `name`/`slug` (ไม่จำเป็นต้อง snapshot เพราะแค่แสดง display เฉยๆ แต่ `unitPrice` ต้อง snapshot แน่นอน)

---

## ⚡ Flow การทำงานจริงตอน Checkout — ลำดับการเรียก

```
ลูกค้ากด "สั่งซื้อ"
    │
    ▼
[บุญ - order-svc]
1. เรียก POST /stock/check ───────────────► [เดียร์ - inventory-svc]
   ← ถ้า available = false → return 409 ให้ frontend
   ← ถ้า available = true → ไปต่อ

2. ดึง Address จาก user-svc (เขต)
   สร้าง shippingAddressSnapshot

3. สร้าง Order (status = pending)
   สร้าง OrderItems (snapshot unitPrice)

4. เรียก POST /stock/reserve ────────────► [เดียร์ - inventory-svc]
   ← ถ้า reserved = false → ลบ Order + return 409
   ← ถ้า reserved = true → ไปต่อ

5. Return orderId ให้ frontend ไปหน้า payment
    │
    ▼
[บุญ - payment-svc]
6. รับ POST /payments จาก frontend
   Charge ผ่าน Omise

7A. Payment สำเร็จ (paid):
    - อัปเดต Payment.status = paid
    - เรียก order-svc อัปเดต Order.status = confirmed
    - เรียก POST /stock/sale-deduct ──────► [เดียร์ - inventory-svc]
    - publish QStash: payment.success ──────► [เดียร์ - notification-svc]
    - publish QStash: order.status_changed ─► [เดียร์ - notification-svc]

7B. Payment ล้มเหลว (failed):
    - อัปเดต Payment.status = failed
    - อัปเดต Order.status = cancelled
    - เรียก POST /stock/release ──────────► [เดียร์ - inventory-svc]
    - publish QStash: order.status_changed (cancelled) ► [เดียร์ - notification-svc]
```

---

## 🚨 กฎที่ทั้งคู่ต้องจำ

| กฎ | บุญ | เดียร์ |
|---|---|---|
| Auth middleware | ทุก endpoint ต้องผ่าน `verifyKindeToken` | เหมือนกัน |
| Error format | `{ "error": { "code": "...", "message": "..." } }` | เหมือนกัน |
| ห้ามแก้สต็อกตรง | — | ห้าม `UPDATE inventory SET quantity = ...` โดยตรง ต้องผ่าน `InventoryLog` เสมอ |
| Idempotency | ถ้าเรียก release 2 ครั้ง (edge case) ต้องไม่พัง | endpoint ต้องรับมือได้ |

---

## 📋 Checklist ก่อน Integrate จริง

**เดียร์ต้องทำให้เสร็จก่อน:**
- [ ] `POST /stock/check` พร้อมใช้งานใน inventory-svc
- [ ] `POST /stock/reserve` พร้อมใช้งาน (atomic transaction)
- [ ] `POST /stock/release` พร้อมใช้งาน
- [ ] `POST /stock/sale-deduct` พร้อมใช้งาน
- [ ] `GET /products/:productId` คืน name + images กลับมา
- [ ] แจ้งบุญว่า base URL ของ inventory-svc ตอน dev คือ `http://localhost:8797`

**บุญต้องทำให้เสร็จก่อน:**
- [ ] `POST /orders` (checkout flow) ยิง stock/check และ stock/reserve ก่อนสร้าง order
- [ ] logic rollback ถ้า payment fail → เรียก stock/release
- [ ] publish `order.status_changed` event ทุกครั้งที่สถานะเปลี่ยน
- [ ] publish `payment.success` event หลังชำระสำเร็จ
- [ ] แจ้งเดียร์ว่า order-svc อยู่ที่ `http://localhost:8792`, payment-svc อยู่ที่ `http://localhost:8793`

---

## 🛠️ วิธีทดสอบโดยไม่รอกัน (ก่อน integrate จริง)

ระหว่างที่อีกฝ่ายยังไม่เสร็จ ให้ทดสอบด้วย mock

**บุญ mock inventory-svc** (ระหว่างรอเดียร์):
```js
// ใน order-svc ชั่วคราว — เอาออกเมื่อ integrate จริง
async function checkStock(items) {
  // TODO: เปลี่ยนเป็น fetch("http://localhost:8797/stock/check") เมื่อเดียร์พร้อม
  return { available: true, items: items.map(i => ({ ...i, currentStock: 99, ok: true })) };
}
```

**เดียร์ mock order events** (ระหว่างรอบุญ):
```js
// ทดสอบ notification-svc ด้วย curl โดยไม่รอบุญ
curl -X POST http://localhost:8791/webhooks/qstash \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success","orderId":"test-uuid","customerId":"test-uuid"}'
```

---

*อัปเดตล่าสุด: 23 มิ.ย. 2568 | ต้องตกลงกันก่อนเริ่ม Phase 2*
