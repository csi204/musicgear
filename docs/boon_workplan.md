# 📋 แผนงานบุญ — MusicGear Hub

> ไฟล์นี้เป็นแผนงานส่วนตัวของ **บุญ** สร้างโดย AI (Antigravity) หลังอ่านเอกสารทั้งหมดใน `docs/` และตรวจสอบสถานะโค้ดจริงในโปรเจกต์แล้ว อัปเดตทุกครั้งที่เริ่มทำงานกับ AI

---

## 🙋 หน้าที่ของบุญในโปรเจกต์

| ด้าน | งาน |
|---|---|
| **Frontend** | `apps/web` — Customer Web App (light mode, ภาษาไทย) |
| **Backend** | `cart-svc`, `order-svc`, `payment-svc` — pipeline "ซื้อของ" ทั้งสาย |
| **งานเสริม** | SA database lead — ดูแล schema ของทั้ง 3 service ให้ถูกต้อง |

---

## 🗺️ ภาพรวม Flow ที่บุญรับผิดชอบ

```
[Customer] → หน้าสินค้า (product-svc ของเดียร์)
                  ↓
          [เพิ่มของลงตะกร้า]
                  ↓
          cart-svc (บุญ) ← เก็บใน Postgres
                  ↓
          [กดสั่งซื้อ / Checkout]
                  ↓ ← เรียก product-svc เช็คสต็อก (ประสานเดียร์)
          order-svc (บุญ)
                  ↓
          [เลือกช่องทางชำระ]
                  ↓
          payment-svc (บุญ) → Omise
                  ↓
          publish QStash event → notification-svc (เดียร์)
```

---

## 🚦 สถานะโปรเจกต์ตอนนี้ (ตรวจสอบเมื่อ 23 มิ.ย. 68)

### ✅ ที่มีแล้ว (scaffold เปล่า)
- `cart-svc` — มีแค่ `/health` endpoint, Prisma schema มี `Cart` + `CartItem` แล้ว แต่ยังไม่มี business logic
- `order-svc` — มีแค่ `/` health check, Prisma schema มี `Order`, `OrderItem`, `Shipment` ครบ
- `payment-svc` — มีแค่ `/` health check, Prisma schema มี `Payment` ครบ
- `apps/web` — มีหน้า products, cart, checkout เป็น placeholder ยังไม่มีเนื้อหาจริง
- `packages/types/src/events.js` — มี Zod schema ของ events ครบ (`orderStatusChangedEvent`, `paymentSuccessEvent`)

### ⏳ รอจากเขต (ก่อนเริ่ม integrate ได้)
- `auth-svc` — ต้องใช้สำหรับ authenticate ก่อนใช้งาน endpoint ที่ต้อง login
- `user-svc` — ต้องใช้ดึง `addressId` ของลูกค้าตอน checkout

### ⏳ รอจากเดียร์ (ก่อน integrate ได้)
- `product-svc` — endpoint เช็คสต็อก/จองสต็อก ตอน checkout

---

## 📅 ลำดับการทำงานของบุญ

### 🔵 Phase 1 — ทำได้เดี๋ยวนี้เลย (ไม่รอใคร)

> เขียนเองได้เลย ไม่ขึ้นกับ auth-svc หรือ product-svc

#### 1.1 cart-svc — Business Logic

**ต้องทำ:**
- [x] `POST /carts` — สร้างตะกร้าใหม่ (guest หรือ logged-in)
- [x] `GET /carts/:cartId` — ดูรายการสินค้าในตะกร้า
- [x] `POST /carts/:cartId/items` — เพิ่มสินค้าลงตะกร้า
- [x] `PATCH /carts/:cartId/items/:itemId` — แก้จำนวน
- [x] `DELETE /carts/:cartId/items/:itemId` — ลบสินค้าออก
- [x] `DELETE /carts/:cartId` — ล้างตะกร้าทั้งหมด (หลังชำระเงินเสร็จ)
- [x] `POST /carts/merge` — merge guest cart → logged-in cart ตอน login (ดู `frontend/skill.md` ข้อ 7)

**โครงสร้างไฟล์ที่ต้องสร้าง:**
```
services/cart-svc/src/
├── routes/
│   └── carts.js
├── services/
│   └── cart.service.js
├── db/
│   └── prisma.js          ← import Prisma Client
└── index.js               ← เพิ่ม route mount
```

**กฎที่ต้องจำ:**
- `cartId` เป็น UUID ออกจาก Postgres ไม่ใช่จาก Redis
- `customerId` เป็น null ได้ (guest cart) ใส่ค่าเมื่อ login แล้ว merge
- ราคาในตะกร้า (`CartItem.price`) ต้อง snapshot ณ ตอนที่เพิ่มสินค้า ไม่ใช่ query แบบ real-time

#### 1.2 order-svc — Business Logic (ส่วนที่ไม่ต้องข้ามไป product-svc)

**ต้องทำก่อน (ไม่ขึ้นกับใคร):**
- [x] Prisma migration รัน schema จริงเข้า Neon (`pnpm dlx prisma migrate dev`)
- [x] `GET /orders/:orderId` — ดูรายละเอียด order
- [x] `GET /orders?customerId=xxx` — ดูประวัติ order ของลูกค้า
- [x] `PATCH /orders/:orderId/status` — Staff/Admin อัปเดตสถานะ (ต้องมี RBAC)

#### 1.3 Frontend — Customer Web App โครงสร้างหน้า

**ต้องทำ:**
- [x] ทำ Layout หลัก (`apps/web/app/layout.tsx`) — Navbar + Footer ตาม design system
- [x] หน้าแสดงสินค้า (`/products`) — grid สินค้า (ดึงจาก product-svc ของเดียร์เมื่อพร้อม)
- [x] หน้า Cart (`/cart`) — รายการ, ปรับจำนวน, ลบ, ราคารวม
- [x] Component `CartProvider` — state management ของ cart

**Design System ที่ต้องใช้ (Customer Web = Light Mode):**
```
Background: #F5F3EE  (--color-warm-offwhite)
Accent:     #2F5DFF  (--color-electric-blue)
Font:       Inter + Noto Sans Thai
```

---

### 🟡 Phase 2 — รอ auth-svc + product-svc พร้อม (ทำขนานกันได้บางส่วน)

> เมื่อเขตเสร็จ auth-svc และเดียร์มี product-svc endpoint สต็อกพื้นฐาน

#### 2.1 order-svc — Checkout Flow (สำคัญที่สุด)

**ต้องทำ:**
- [x] `POST /orders` — สร้าง order จาก cart
  - ดึง `cart items` จาก `cart-svc`
  - **เรียก `product-svc` เช็คสต็อกก่อน** (ประสานเดียร์เรื่อง endpoint + payload)
  - **เรียก `user-svc` ดึง address** (ประสานเขต)
  - สร้าง snapshot `shippingAddressSnapshot` (JSON)
  - สร้าง `OrderItem` พร้อม snapshot ราคา ณ วันนั้น
  - เรียก `product-svc` จอง (reserve) สต็อก
  - ล้าง cart หลังสร้าง order สำเร็จ

**API Contract ที่ต้องตกลงกับเดียร์:**
```js
// บุญเรียก product-svc เพื่อเช็คและจองสต็อก
// ต้องตกลง endpoint + payload นี้ก่อนเขียนโค้ด

// เช็คสต็อก
GET /products/:productId/stock
// Response: { productId, quantity, isAvailable }

// จองสต็อก (reserve)
POST /products/:productId/stock/reserve
// Body: { quantity: number, orderId: string }
// Response: { success: boolean }
```

#### 2.2 Frontend — หน้า Checkout

- [x] หน้า Checkout (`/checkout`) — แสดงรายการ, เลือกที่อยู่, สรุปราคา
- [x] Form เลือกที่อยู่ — ดึงจาก `user-svc` (auth required)
- [x] หน้า Order Detail (`/orders/[id]`) — แสดงสถานะ order

---

### 🔴 Phase 3 — เชื่อม Payment (ทำหลัง checkout flow เสร็จ)

#### 3.1 payment-svc — Omise Integration

**ต้องทำ:**
- [x] ทำความเข้าใจ Omise API ก่อน (sandbox)
- [x] `POST /payments` — สร้าง payment จาก orderId
  - Charge ผ่าน Omise
  - บันทึก `transactionRef`
  - อัปเดต `Payment.status = paid`
- [x] `POST /payments/:paymentId/refund` — คืนเงิน (admin only)
- [x] Publish QStash event `payment.success` หลังชำระสำเร็จ

**Payload ที่ต้อง publish (ดู `packages/types/src/events.js`):**
```js
// paymentSuccessEvent — เดียร์จะรับไปทำ notification
{
  event: "payment.success",
  orderId: "uuid",
  customerId: "uuid"
}
```

#### 3.2 order-svc — หลัง payment สำเร็จ

- [x] Webhook receiver รับ event จาก `payment-svc` → อัปเดต `Order.status = confirmed`
- [x] Publish QStash event `order.status_changed` (ดู `packages/types/src/events.js`)

---

## 🤝 จุดประสานงานกับทีม

### ประสาน **เขต** (ผ่าน PR/chat ทีม)

| เรื่อง | ต้องรู้อะไร | เมื่อไหร่ |
|---|---|---|
| Auth middleware | วิธีใช้ `createAuthMiddleware` + decode role จาก JWT | ก่อน Phase 2 |
| user-svc address endpoint | `GET /users/:userId/addresses` response shape | ก่อนทำ checkout |

### ประสาน **เดียร์** โดยตรง

| เรื่อง | ต้องตกลงอะไร | เมื่อไหร่ |
|---|---|---|
| เช็คสต็อก endpoint | path + request/response shape | ก่อน Phase 2 |
| Reserve สต็อก endpoint | path + request/response shape + rollback ถ้า payment fail | ก่อน Phase 2 |
| Event format | ดู `packages/types/src/events.js` ใช้อยู่แล้ว | ตอนนี้ได้เลย |

> ⚠️ **เรื่องสำคัญ**: ถ้า payment fail หลัง reserve สต็อกไปแล้ว ต้องตกลงกับเดียร์ว่าจะ release สต็อกยังไง — บุญต้องเรียก `product-svc` release กลับ หรือ product-svc มี timeout auto-release?

---

## 🛠️ กฎที่บุญต้องจำ (จาก docs/)

### Backend Rules (จาก `backend/skill.md`)

1. **Layer ต้องแยกชัด**: `routes/` → รับ request → `services/` → business logic → `db/` → query เท่านั้น ห้าม query ใน route handler
2. **Validate ทุก endpoint** ด้วย Zod จาก `packages/types`
3. **Error shape เดียวกัน**: `{ "error": { "code": "...", "message": "..." } }`
4. **Auth ต้องมี 2 ชั้น**: `verifyKindeToken` + `requireRole(...)` ทุก endpoint ที่ต้องการสิทธิ์
5. **ห้าม query ข้าม schema** ของ service อื่นตรงๆ

### Frontend Rules (จาก `frontend/skill.md`)

1. **Server Component เป็น default** — ใช้ `"use client"` เฉพาะ interactive
2. **เรียก API ผ่าน `packages/api-client`** เท่านั้น ห้าม fetch ตรงๆ ใน component
3. **Form ใช้ `react-hook-form` + `zodResolver`** + schema จาก `packages/types`
4. **Cart state เป็น server state** — ไม่เก็บใน localStorage (เก็บใน `cart-svc`)
5. **URL หน้าสินค้าใช้ `slug`** ไม่ใช่ UUID

### Snapshot Pattern (จาก `design.md`)

- `Order.shippingAddressSnapshot` ต้อง freeze ณ วันที่สั่งซื้อ
- `OrderItem.unitPrice` ต้อง freeze ณ วันที่สั่งซื้อ ห้าม join มาจาก product-svc ตอนแสดงประวัติ

---

## 🤖 วิธีทำงานร่วมกับ AI (Antigravity) ให้มีประสิทธิภาพสูงสุด

### หลักการทั่วไป

1. **บอก context ก่อนทำงานทุกครั้ง** — บอกว่ากำลังอยู่ Phase ไหน ทำ service ไหน ต้องการอะไร
2. **ให้ทำทีละ task เล็กๆ** — อย่าให้ทำทุกอย่างพร้อมกัน ทำทีละ endpoint จะได้ตรวจ review ง่าย
3. **Review ทุก PR ก่อน merge** — ดูที่ business logic เป็นหลัก ไม่ใช่แค่ code style
4. **Mention docs เสมอ** — พิมพ์ `@[docs]` หรือชี้ไฟล์ที่เกี่ยวข้องเพื่อให้ AI อ่าน context ถูกต้อง

### วิธีให้งาน AI

**รูปแบบที่ดี:**
```
ทำ endpoint POST /carts/:cartId/items ใน cart-svc
- รับ: { productId, quantity, price }
- validate ด้วย Zod
- บันทึกลง CartItem
- ถ้า productId ซ้ำใน cart เดิม ให้บวกจำนวนเพิ่ม
- ใช้โครงสร้าง routes/services/db ตาม structure.md
```

**รูปแบบที่ไม่ดี:**
```
ทำ cart ให้หน่อย
```

### สิ่งที่บุญต้องตัดสินใจเอง (AI ช่วยได้แต่ไม่ควร decide แทน)

- ❗ API contract ที่ต้องตกลงกับเดียร์ (เช็คสต็อก/reserve)
- ❗ Logic การ rollback สต็อกถ้า payment fail
- ❗ UX/UI decisions ที่กระทบ design (ต้องดู Figma ก่อน)
- ❗ การ merge PR — review เองเสมอ

---

## 📌 Checklist ก่อนเริ่มทำงานแต่ละ session

- [ ] รัน `pnpm run dev` แล้วทุก service รันขึ้นปกติ
- [ ] อยู่บน branch `feature/<ชื่องาน>` ไม่ใช่ `dev` หรือ `main`
- [ ] รู้ว่า task นี้อยู่ใน Phase ไหน ต้องรอใครบ้าง
- [ ] ถ้าเปลี่ยน API contract → แจ้งเดียร์/เขตก่อนเขียนโค้ด

---

## 📬 Port Map (สำหรับ dev local)

| Service/App | Port |
|---|---|
| api-gateway | 8788 |
| auth-svc | 8789 |
| cart-svc | 8790 |
| notification-svc | 8791 |
| order-svc | 8792 |
| payment-svc | 8793 |
| product-svc | 8794 |
| report-svc | 8795 |
| user-svc | 8796 |
| inventory-svc | 8797 |
| admin app | 8798 |
| staff app | 8799 |
| web app (Customer) | 8800 |

---

*อัปเดตล่าสุด: 23 มิ.ย. 2568 | สร้างโดย Antigravity AI หลังอ่านเอกสารโปรเจกต์ครบทุกไฟล์*
