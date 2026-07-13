# 📋 รายงานการปฏิบัติตามกฎเกณฑ์การออกแบบระบบ (Design Compliance Report)

เอกสารนี้รวบรวมรายการ **"กฎข้อบังคับของระบบ (System Rules)"** ที่ระบุในคู่มือโปรเจกต์ เปรียบเทียบกับ **"สิ่งที่ บุญ ได้ลงมือทำจริง"** พร้อมแสดงไฟล์โค้ดในโปรเจกต์เพื่อใช้เป็นหลักฐานยืนยันความถูกต้องต่อนักพัฒนาในทีมและอาจารย์ครับ

---

## 📌 หมวดที่ 1: สถาปัตยกรรมระบบตะกร้าสินค้า (Cart System & Redis Caching)

### 🔴 กฎข้อที่ 1: ระบบตะกร้าสินค้า (cart-svc) ต้องใช้ Redis (Upstash) สำหรับบันทึกข้อมูล
* **เอกสารอ้างอิง:** 
  * [docs/design.md บรรทัดที่ 14 และ 28](./design.md#L14)
  * [docs/skill.md บรรทัดที่ 30](./skill.md#L30)
* **สิ่งที่เราทำจริง:** 
  * นำสถาปัตยกรรมแบบไฮบริด (Hybrid Architecture) มาใช้งานในการเก็บตะกร้าสินค้า:
    1. **Guest Cart:** เก็บไว้ชั่วคราวใน **Upstash Redis** เพื่อประสิทธิภาพในการดึงข้อมูลที่รวดเร็วและใช้ความสามารถในการสลายตัวเองเมื่อครบกำหนดอายุ
    2. **User Cart:** เก็บข้อมูลลงใน **Neon PostgreSQL** ผ่าน Prisma Client เพื่อความคงอยู่ถาวรและความปลอดภัยสูงของตะกร้าสมาชิก
* **ไฟล์หลักฐานย่อย (Evidence Files):**
  * [services/cart-svc/package.json](../services/cart-svc/package.json): ติดตั้งทััง `@upstash/redis`, `@prisma/client` และ `@neondatabase/serverless`
  * [services/cart-svc/prisma/schema.prisma](../services/cart-svc/prisma/schema.prisma): ปรับโครงสร้างสคีมาตาราง `Cart` และ `CartItem` ใน Postgres ให้รองรับ `customerId` แบบ String และเก็บสินค้าแยกตามประเภทสี
  * [services/cart-svc/src/services/cart.service.js](../services/cart-svc/src/services/cart.service.js): เมธอดทั้งหมดเช่น `createCart`, `addItem` และ `mergeCarts` มีการแยกเขียนระหว่างการเรียกใช้ `redis` สำหรับ Guest และ `prisma` สำหรับ User
  * [services/cart-svc/src/routes/carts.js](../services/cart-svc/src/routes/carts.js): ปรับพอร์ตเชื่อมต่อให้ดึงทั้ง `getRedis()` และ `getPrisma()` เพื่อส่งต่อให้เซสชันการทำงานของ Service

---

### 🔴 กฎข้อที่ 2: ตะกร้าสินค้าชั่วคราว (Guest Cart) ต้องสลายตัวอัตโนมัติ (Fast & Non-persistent)
* **เอกสารอ้างอิง:** 
  * [docs/design.md บรรทัดที่ 28](./design.md#L28)
* **สิ่งที่เราทำจริง:** 
  * เมื่อสร้างหรืออัปเดตตะกร้าสินค้าแบบ Guest (ผู้ใช้ยังไม่ล็อกอิน) ระบบจะทำการตั้งเวลาหมดอายุของคีย์ใน Redis (TTL) เป็นเวลา **7 วัน (604800 วินาที)** อัตโนมัติ ป้องกันข้อมูลขยะบวมค้างในระบบ
* **ไฟล์หลักฐานย่อย (Evidence Files):**
  * [services/cart-svc/src/services/cart.service.js](../services/cart-svc/src/services/cart.service.js): ค้นหาคำสั่ง `redis.expire` ในฟังก์ชัน `createCart`, `addItem`, `updateItem`, `removeItem` และ `clearCart`

---

### 🔴 กฎข้อที่ 3: ตะกร้าสินค้าต้องเป็น Server-State (ห้ามเก็บใน LocalStorage บนเบราว์เซอร์)
* **เอกสารอ้างอิง:** 
  * [docs/frontend/skill.md บรรทัดที่ 52](./frontend/skill.md#L52)
* **สิ่งที่เราทำจริง:** 
  * พัฒนาหน้าเว็บฝั่ง Customer Web ให้บันทึกข้อมูลตะกร้าสินค้าจริงผ่าน API Gateway เพื่อส่งต่อหา `cart-svc`
  * เมื่อลูกค้าทำการเข้าสู่ระบบ (Login) หน้าเว็บจะทำการสั่ง Merge ตะกร้า Guest ทันทีเพื่อผสานสินค้าเข้าสู่ตะกร้าสมาชิกในฐานข้อมูลหลักอย่างถูกต้อง
* **ไฟล์หลักฐานย่อย (Evidence Files):**
  * [apps/web/hooks/useCart.ts](../apps/web/hooks/useCart.ts): โค้ดทั้งหมดของ React Hook มีการปรับเปลี่ยนให้เรียกใช้งาน `cartApi` ในการเพิ่ม/ปรับ/ลบสินค้า และทำการตรวจสอบและ Merge ตะกร้าอัตโนมัติในส่วน `syncCart`

---

## 📌 หมวดที่ 2: ระบบจัดการที่อยู่และการสื่อสารระหว่างบริการ (Event-Driven Address Sync)

### 🔴 กฎข้อที่ 4: การทำงานข้ามบริการต้องเป็นอิสระต่อกัน (Database-per-service)
* **เอกสารอ้างอิง:** 
  * [docs/skill.md กฎเหล็กข้อที่ 1](./skill.md#L17)
  * [docs/design.md (Snapshot Pattern)](./design.md#L35)
* **สิ่งที่เราทำจริง:** 
  * บริการ `order-svc` จะไม่ยิงคิวรีข้อมูลที่อยู่ (Address) ข้ามตารางของ `user-svc` โดยตรงเพื่อความถูกต้องตามหลัก Microservices
  * `order-svc` จะมีตาราง `Address` ท้องถิ่นของตนเองเพื่อคอยซิงก์ข้อมูลมาเก็บสะสมแบบเดี่ยว ป้องกันไม่ให้ออเดอร์แสดงผลล้มเหลวหากผู้ใช้ทำการลบข้อมูลที่อยู่ใน `user-svc`
* **ไฟล์หลักฐานย่อย (Evidence Files):**
  * [services/order-svc/prisma/schema.prisma](../services/order-svc/prisma/schema.prisma): มีการเพิ่มโมเดล `model Address` แยกอิสระในสคีมาของตนเอง

---

### 🔴 กฎข้อที่ 5: การส่งข้อความ Async Event ห้ามใช้ raw Redis Pub/Sub (ต้องใช้ QStash Webhook)
* **เอกสารอ้างอิง:** 
  * [docs/skill.md กฎเหล็กข้อที่ 5](./skill.md#L21)
* **สิ่งที่เราทำจริง:** 
  * สร้างช่องทางรับข้อมูล Webhook ท้องถิ่นใน `order-svc` เพื่อรอฟังข้อมูล Event `address.created` และ `address.updated` ผ่าน QStash Subscriber
* **ไฟล์หลักฐานย่อย (Evidence Files):**
  * [services/order-svc/src/index.js](../services/order-svc/src/index.js): เพิ่ม Endpoint `/webhooks/qstash` โดยทำการตรวจสอบความถูกต้องของข้อมูล (Zod validation) และสั่งอัปเดตข้อมูลที่อยู่ผ่าน `AddressService.upsertAddress`
  * [services/order-svc/src/services/address.service.js](../services/order-svc/src/services/address.service.js): ไฟล์ Service ในการควบคุมคำสั่ง upsert ข้อมูลที่อยู่ผู้ใช้ลงใน Postgres
  * [packages/types/src/events.js](../packages/types/src/events.js): เพิ่มการประกาศสคีมาตรวจสอบความถูกต้องของ Event ที่อยู่
