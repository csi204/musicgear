# ✅ Task List — Phase 1 (บุญ)

> Phase 1 = ทำได้เดี๋ยวนี้ ไม่ต้องรอเขตหรือเดียร์
> อัปเดต `[ ]` → `[/]` ตอนเริ่มทำ → `[x]` ตอนเสร็จ

---

## 🅰️ cart-svc — Backend

> Path: `services/cart-svc/`
> Port dev: `http://localhost:8790`
> Prisma schema: มี `Cart` + `CartItem` พร้อมแล้ว

### ขั้นตอนที่ 0 — Setup (ทำก่อนเริ่มเขียน route)

- [x] **0.1** รัน Prisma migration เข้า Neon จริง
  ```bash
  cd services/cart-svc
  npx prisma migrate dev --name init
  ```
- [x] **0.2** สร้างโครงไฟล์ที่ต้องมี (ยังไม่ต้องมี logic)
  ```
  services/cart-svc/src/
  ├── db/
  │   └── prisma.js        ← สร้างใหม่
  ├── services/
  │   └── cart.service.js  ← สร้างใหม่
  ├── routes/
  │   └── carts.js         ← สร้างใหม่
  └── index.js             ← อัปเดต (mount route เข้า)
  ```
- [x] **0.3** เขียน `db/prisma.js` — init Prisma client พร้อม neon adapter
  ```js
  import { PrismaClient } from "../generated/prisma/client.js";
  import { PrismaNeon } from "@prisma/adapter-neon";
  import { neon } from "@neondatabase/serverless";

  export function createPrisma(databaseUrl) {
    const sql = neon(databaseUrl);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({ adapter });
  }
  ```

---

### ขั้นตอนที่ 1 — สร้างตะกร้า

- [x] **1.1** `POST /carts` — สร้างตะกร้าใหม่
  - ถ้า guest: รับ `sessionId` (string ที่ frontend generate เอง)
  - ถ้า login: รับ `customerId` (UUID จาก JWT)
  - return: `{ cartId, customerId, sessionId, items: [] }`
  ```js
  // Request body
  { "customerId": "uuid | null", "sessionId": "string | null" }
  // Response 201
  { "cartId": "uuid", "customerId": null, "sessionId": "xxx", "items": [] }
  ```

- [x] **1.2** `GET /carts/:cartId` — ดูสินค้าในตะกร้า
  - return cart + items ทั้งหมด
  - ถ้าไม่เจอ → 404
  ```js
  // Response 200
  {
    "cartId": "uuid",
    "customerId": null,
    "sessionId": "xxx",
    "items": [
      { "cartItemId": "uuid", "productId": "uuid", "quantity": 2, "price": "1500.00" }
    ]
  }
  ```

---

### ขั้นตอนที่ 2 — จัดการสินค้าในตะกร้า

- [x] **2.1** `POST /carts/:cartId/items` — เพิ่มสินค้า
  - รับ `{ productId, quantity, price }` — price ต้อง snapshot ณ ตอนนั้น
  - ถ้า productId ซ้ำใน cart → บวกจำนวนเพิ่ม (ไม่สร้าง row ใหม่)
  - Validate ด้วย Zod: `productId` UUID, `quantity` int > 0, `price` number > 0
  ```js
  // Request
  { "productId": "uuid", "quantity": 2, "price": 1500.00 }
  // Response 201
  { "cartItemId": "uuid", "cartId": "uuid", "productId": "uuid", "quantity": 2, "price": "1500.00" }
  ```

- [x] **2.2** `PATCH /carts/:cartId/items/:itemId` — แก้จำนวน
  - รับ `{ quantity }` เท่านั้น
  - ถ้า quantity = 0 → ลบ item นั้นออก
  - ถ้าไม่เจอ item → 404
  ```js
  // Request: { "quantity": 3 }
  // Response 200: { "cartItemId": "uuid", "quantity": 3, "price": "1500.00" }
  ```

- [x] **2.3** `DELETE /carts/:cartId/items/:itemId` — ลบสินค้าออก 1 ชิ้น
  - ถ้าไม่เจอ → 404
  - Response 204 (No Content)

- [x] **2.4** `DELETE /carts/:cartId` — ล้างตะกร้าทั้งหมด
  - ลบ CartItems ทั้งหมด (ไม่ลบ Cart record เพื่อ reuse cartId)
  - Response 204

---

### ขั้นตอนที่ 3 — Merge Cart (guest → login)

- [x] **3.1** `POST /carts/merge` — รวม guest cart เข้า logged-in cart
  - รับ `{ guestCartId, customerId }` (ถ้ายังไม่มี customerCart → สร้างให้)
  - Logic: นำ items จาก guestCartId ไปรวมกับ customerCart (บวกจำนวนถ้า productId ซ้ำ)
  - หลัง merge → ลบ guestCart ทิ้ง
  ```js
  // Request: { "guestCartId": "uuid", "customerId": "uuid" }
  // Response 200: { "cartId": "uuid", "customerId": "uuid", "items": [...merged] }
  ```

---

### ขั้นตอนที่ 4 — Mount Routes & ทดสอบ

- [x] **4.1** อัปเดต `src/index.js` — mount `carts.js` route เข้า Hono app
- [x] **4.2** ทดสอบด้วย curl ทุก endpoint
  ```bash
  curl -X POST http://localhost:8790/carts \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test-session-001"}'
  ```
- [x] **4.3** ตรวจว่า error response ถูก format
  ```json
  { "error": { "code": "NOT_FOUND", "message": "ไม่พบตะกร้าสินค้า" } }
  ```

---

## 🅱️ order-svc — Backend (ส่วนที่ไม่รอใคร)

> Path: `services/order-svc/`
> Port dev: `http://localhost:8792`
> Prisma schema: มี `Order`, `OrderItem`, `Shipment` ครบแล้ว

### ขั้นตอนที่ 0 — Setup

- [x] **0.1** รัน Prisma migration เข้า Neon
  ```bash
  cd services/order-svc
  npx prisma migrate dev --name init
  ```
- [x] **0.2** สร้างโครงไฟล์
  ```
  services/order-svc/src/
  ├── db/
  │   └── prisma.js
  ├── services/
  │   └── order.service.js
  ├── routes/
  │   └── orders.js
  └── index.js
  ```

### ขั้นตอนที่ 1 — Read Endpoints

- [x] **1.1** `GET /orders/:orderId` — ดูรายละเอียด order
  - ต้อง include `items` + `shipment` (ถ้ามี)
  - RBAC: customer เห็นเฉพาะ order ตัวเอง, staff/admin เห็นทั้งหมด
  - ถ้าไม่เจอ → 404
  ```js
  // Response 200
  {
    "orderId": "uuid",
    "customerId": "uuid",
    "status": "pending",
    "totalAmount": "45000.00",
    "grandTotal": "45500.00",
    "shippingFee": "500.00",
    "discountAmount": "0.00",
    "shippingAddressSnapshot": { "receiverName": "...", "addressLine1": "..." },
    "items": [
      { "orderItemId": "uuid", "productId": "uuid", "quantity": 1, "unitPrice": "45000.00", "totalPrice": "45000.00" }
    ],
    "shipment": null
  }
  ```

- [x] **1.2** `GET /orders` — ดูประวัติ orders
  - `?customerId=uuid` — บังคับใส่เสมอ (ป้องกัน dump ทั้งหมด)
  - `?status=pending` — filter (optional)
  - `?page=1&limit=20` — pagination
  ```js
  // Response 200
  { "orders": [...], "total": 5, "page": 1, "limit": 20 }
  ```

### ขั้นตอนที่ 2 — Status Update

- [x] **2.1** `PATCH /orders/:orderId/status` — Staff/Admin อัปเดตสถานะ
  - รับ `{ status }` ตาม enum OrderStatus
  - RBAC: customer → 403
  - Validate status transition: pending→confirmed→packed→shipped→delivered (ห้ามข้ามขั้น)
  - ⚠️ TODO: publish QStash event `order.status_changed` (ทำตอน Phase 3)
  ```js
  // Request: { "status": "packed" }
  // Response 200: { "orderId": "uuid", "status": "packed" }
  ```

- [x] **2.2** Mount routes เข้า `index.js` + ทดสอบด้วย curl

---

## 🅲️ apps/web — Frontend

> Path: `apps/web/`
> Port dev: `http://localhost:8800`
> มีอยู่แล้ว: `layout.tsx` (fonts), `login-button.tsx`, `lib/auth.ts`
> ยังขาด: Navbar, CartProvider, หน้า Cart จริง, หน้า Products จริง

### ขั้นตอนที่ 1 — Layout & Navigation

- [ ] **1.1** สร้าง `apps/web/components/navbar.tsx`
  - Light mode: background `#F5F3EE`, accent `#2F5DFF`
  - ซ้าย: โลโก้ "MusicGear" + link `/products`
  - ขวา: cart icon (lucide-react) + จำนวนสินค้า + ปุ่ม Login/Logout
  - Responsive: hamburger menu บน mobile
  - ใช้ icon จาก `lucide-react` ห้ามใช้ emoji

- [ ] **1.2** สร้าง `apps/web/components/footer.tsx`
  - Copyright text เท่านั้น

- [ ] **1.3** อัปเดต `apps/web/app/layout.tsx` — ใส่ Navbar + Footer ครอบ children

---

### ขั้นตอนที่ 2 — Cart State Management

> Cart เป็น server state เก็บใน cart-svc (ไม่ใช่ localStorage) ตาม `frontend/skill.md` ข้อ 7

- [ ] **2.1** สร้าง `apps/web/lib/api.ts` — typed fetch wrapper
  - ชี้ไปที่ API Gateway: `NEXT_PUBLIC_API_URL ?? "http://localhost:8788"`
  - Export `cartApi` ที่มี method: `create`, `get`, `addItem`, `updateItem`, `removeItem`, `clear`

- [ ] **2.2** สร้าง `apps/web/hooks/useCart.ts` — React hook
  - เก็บ `cartId` ใน `localStorage` (เพื่อ persist ข้าม session)
  - Expose: `cartItems`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`

- [ ] **2.3** สร้าง `apps/web/components/cart-provider.tsx`
  - React Context + Provider ห่อ app ทั้งหมด
  - อัปเดต `layout.tsx` ใส่ `<CartProvider>`

---

### ขั้นตอนที่ 3 — หน้า Cart

- [ ] **3.1** อัปเดต `apps/web/app/cart/page.tsx` — UI จริง
  - แสดงรายการสินค้า: ชื่อ, ราคา, จำนวน, ราคาต่อรายการ
  - ปุ่ม + / − ปรับจำนวน (เรียก `updateQuantity`)
  - ปุ่ม trash ลบสินค้า (เรียก `removeItem`)
  - ราคารวมทั้งหมด (sticky bottom)
  - ปุ่ม "ไปชำระเงิน" → `/checkout` (disabled ถ้า items = 0)
  - Empty state: "ตะกร้าว่างเปล่า" + ปุ่มกลับไปดูสินค้า

---

### ขั้นตอนที่ 4 — หน้า Products (Mock Data)

> ข้อมูลจริงมาจาก product-svc ของเดียร์ → ใช้ mock data ก่อนเพื่อไม่ block frontend

- [ ] **4.1** สร้าง `apps/web/components/product-card.tsx`
  - ใช้ shadcn/ui `Card`
  - แสดง: รูป, ชื่อสินค้า, ราคา, ปุ่ม "เพิ่มลงตะกร้า"
  - Design: warm-offwhite bg, electric-blue accent ตาม `designsystem.md`
  - ห้ามใช้ emoji — ใช้ lucide-react icons เท่านั้น

- [ ] **4.2** อัปเดต `apps/web/app/products/page.tsx` — Grid จริง
  - Grid: 3 col (desktop) / 2 col (tablet) / 1 col (mobile)
  - ใช้ mock data 6–8 รายการ (กีต้าร์, กลอง, เบส ฯลฯ)
  - ปุ่ม "เพิ่มลงตะกร้า" → เรียก `addItem` จาก `useCart`
  - ⚠️ เมื่อเดียร์พร้อม → เปลี่ยน mock เป็น fetch จริงจาก api-gateway

---

## 🔍 Definition of Done — Phase 1 เสร็จเมื่อ

- [ ] `cart-svc`: ทุก endpoint ทดสอบด้วย curl ผ่านหมด (7 endpoints)
- [ ] `order-svc`: GET + PATCH endpoints ทดสอบผ่าน
- [ ] `apps/web`: Navbar แสดงผลถูกต้อง, มี CartProvider, Cart page ใช้งานได้จริง
- [ ] เพิ่ม/ปรับ/ลบสินค้าในตะกร้าได้ผ่าน UI จริง (เชื่อม cart-svc จริง)
- [ ] หน้า Products แสดง mock data + เพิ่มลงตะกร้าได้
- [ ] ไม่มี TypeScript errors (`pnpm check-types` ผ่าน)
- [ ] `pnpm run dev` แล้วทุก service ขึ้นปกติ

---

## 📎 Reference Files

| ไฟล์ | หมายเหตุ |
|---|---|
| [boon_workplan.md](./boon_workplan.md) | แผนงานบุญทั้งหมด |
| [boon_dear_contract.md](./boon_dear_contract.md) | API contract กับเดียร์ |
| [backend/skill.md](./backend/skill.md) | กฎ backend ที่ต้องทำตาม |
| [frontend/skill.md](./frontend/skill.md) | กฎ frontend ที่ต้องทำตาม |
| [designsystem.md](./designsystem.md) | สี, font, spacing |
| [cart-svc schema](../services/cart-svc/prisma/schema.prisma) | Cart + CartItem |
| [order-svc schema](../services/order-svc/prisma/schema.prisma) | Order + OrderItem + Shipment |

---

*อัปเดตล่าสุด: 23 มิ.ย. 2568*
