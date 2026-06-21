# design.md — System Design & Architecture Decisions

> เอกสารนี้รวม "ทำไม" ของการตัดสินใจออกแบบทั้งหมด ใช้ตอบคำถามอาจารย์/เพื่อนร่วมทีมตอนถูกถามว่า "ทำไมถึงออกแบบแบบนี้"

## 1. ภาพรวมสถาปัตยกรรม

MusicGear Hub เป็น E-Commerce ที่ใช้สถาปัตยกรรม **Microservices** บน Cloudflare Workers แบ่งเป็น 8 service:

| Service | ความรับผิดชอบ | DB ที่เป็นเจ้าของ |
|---|---|---|
| `auth-svc` | ตรวจสอบ identity ผ่าน Kinde, ออก/verify JWT | — (stateless, พึ่ง Kinde) |
| `user-svc` | users, customers, staff, admins, addresses | UserDB |
| `product-svc` | products, brands, categories, product_images, bundles, **inventory + inventory_logs** | ProductDB + InventoryDB |
| `cart-svc` | carts, cart_items | Redis (Upstash) |
| `order-svc` | orders, order_items, shipments | OrderDB |
| `payment-svc` | payments, เชื่อม Omise | PaymentDB |
| `notification-svc` | notifications, รับ event จาก QStash, ส่งอีเมลผ่าน Resend | NotificationDB |
| `report-svc` | อ่านข้อมูลสรุปจาก service อื่น (ผ่าน API ไม่ใช่ DB ตรง) | ReportDB (cache/aggregate) |

ทุก client (Customer Web, Staff Portal, Admin Portal) เรียกผ่าน **API Gateway** ตัวเดียว ไม่เรียก service ตรงๆ

## 2. ทำไมต้องเป็น Database-per-Service (ไม่ใช้ DB กลางตัวเดียว)

นี่คือหลักการบังคับของ Microservices ไม่ใช่จุดผิด — แต่ละ service เป็นเจ้าของ DB/schema ของตัวเอง ห้าม service อื่นแตะตรงๆ ต้องคุยผ่าน API/event เท่านั้น เหตุผล:

1. **Loose coupling** — `product-svc` แก้ schema เมื่อไหร่ก็ได้โดยไม่กระทบ `order-svc`
2. **Scale แยกอิสระ** — ช่วง sale `ProductDB` โดน load หนักเฉพาะตัว ไม่ลาก `OrderDB` ช้าตาม
3. **เลือกเทคโนโลยีต่างกันได้** — `cart-svc` ใช้ Redis (เร็ว, ไม่ต้อง persist ถาวร) ส่วน `order-svc` ใช้ Postgres (ต้องการ transaction ที่ชัวร์)
4. **Failure isolation** — `payment-svc` ล่ม ลูกค้ายัง browse สินค้าได้ปกติ

**Trade-off ที่ต้องรู้ไว้:** การ join ข้ามservice ทำตรงๆ ไม่ได้ ต้องยิง 2 รอบ (เช่นดู order พร้อมชื่อสินค้า → ถาม OrderSvc ก่อน แล้วเอา productId ไปถาม ProductSvc อีกที) — ยอมแลกความยุ่งยากนี้เพื่อความยืดหยุ่นด้านบน

**ข้อจำกัดเชิงปฏิบัติของโปรเจกต์:** เนื่องจากใช้ Neon (free tier นักศึกษา) จริงๆ จะแยก database จริงเป็น 8 instance ต่อ service ก็ได้ แต่เพื่อประหยัด ใช้ **1 Neon project, แยก Postgres schema ต่อ service** (เช่น `product_svc.products`, `order_svc.orders`) แทน — หลักการ "ห้าม cross-service query ตรง" ยังคงบังคับใช้เหมือนเดิม แค่ physical isolation อ่อนลงเพื่อ cost

## 3. Snapshot Pattern

`orders.shippingAddressSnapshot` และ `order_items.unitPrice` ต้องเก็บค่า ณ ตอนสั่งซื้อเสมอ ไม่ join ไป `addresses`/`products` ตรงๆ ตอนแสดงประวัติ เพราะถ้าลูกค้าแก้ที่อยู่ หรือ admin แก้ราคาสินค้าทีหลัง ประวัติ order เก่าต้องไม่เปลี่ยนตาม

`orders.addressId` มีไว้ควบคู่กัน — ใช้สำหรับ query/relation (เช่น "ลูกค้าคนนี้สั่งไปที่อยู่ไหนบ่อยสุด") ไม่ใช่ source of truth ของที่อยู่ ณ วันที่สั่งซื้อ

## 4. Inventory Audit Trail (`inventory_logs`)

`inventory.quantity` ห้ามถูกแก้ตรงๆ โดยเด็ดขาด ทุก service ที่ต้องการแก้ค่าต้อง insert แถวใหม่ใน `inventory_logs` คู่กันเสมอ — เพื่อให้ staff/admin ตรวจสอบย้อนหลังได้ว่าใครทำอะไรกับสต็อกเมื่อไหร่ (รับของเข้า, ปรับมือ, จองตอน checkout, คืนตอน payment fail, ตัดตอนขายสำเร็จ)

```
action: receive | adjust | reserve | release | sale_deduct
```

## 5. Event-Driven Notification — Upstash QStash

ใช้ **Upstash QStash** แทน Redis PUBLISH/SUBSCRIBE ตรงๆ เพราะ Cloudflare Workers เป็น stateless function ไม่มี connection ค้างไว้ฟัง subscribe ได้ตลอดเวลาแบบ traditional pub/sub QStash ทำงานแบบ publish → ยิง webhook (HTTP POST) ไปหา consumer ซึ่งตรงกับโมเดล Workers พอดี และมี retry ในตัวให้ฟรีถ้าฝั่งรับล่มชั่วคราว

```
stock.updated         (productSvc publish)   -> notifSvc webhook -> back_in_stock notification
order.status_changed  (orderSvc publish)     -> notifSvc webhook -> order_update notification
payment.success       (paymentSvc publish)   -> notifSvc webhook -> order_update notification
```

รายละเอียด payload และ sequence diagram เต็มอยู่ใน `backend/skill.md`

## 6. RBAC — ใครเห็นอะไรได้บ้าง

| Action | Staff | Admin |
|---|---|---|
| ดู revenue summary (top-line) | ❌ | ✅ |
| ดู margin/cost จริง | ❌ | ✅ |
| สร้าง/แก้ bundle + ราคา | ❌ (ขอแค่ request) | ✅ |
| รับของเข้า stock | ✅ | ✅ (approve) |
| ปรับ stock ย้อนหลัง/แก้ไขผิดพลาด | ❌ | ✅ |
| ดู `inventory_logs` | ✅ (เฉพาะของตัวเอง+ทีม) | ✅ (ทั้งหมด) |

ทุก endpoint ต้องมี middleware เช็ค role ก่อนเข้าถึงข้อมูล ไม่ใช่ซ่อนแค่ฝั่ง UI
