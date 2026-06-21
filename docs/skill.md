# SKILL.md — MusicGear Hub

> ไฟล์นี้คือ "คู่มือกฎ" สำหรับใครก็ตามที่เขียนโค้ดในโปรเจกต์นี้ (คนหรือ AI assistant อย่าง Claude Code) อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง แล้วไปอ่านไฟล์ที่เกี่ยวข้องเพิ่มตามหมวดงาน

## อ่านไฟล์ไหนต่อ ตามงานที่ทำ

| กำลังจะทำอะไร | อ่านไฟล์ |
|---|---|
| เข้าใจภาพรวมสถาปัตยกรรม/เหตุผลการออกแบบ | `design.md` |
| ทำ UI, สี, font, component | `designsystem.md` |
| หา path ไฟล์ว่าวางตรงไหนใน monorepo | `structure.md` |
| เขียนหน้าเว็บ/component ฝั่ง Customer-Admin-Staff portal | `frontend/skill.md` |
| เขียน service ฝั่ง backend (Hono + Cloudflare Workers) | `backend/skill.md` |

## กฎเหล็ก 5 ข้อ ที่ห้ามฝ่าฝืนไม่ว่าจะทำงานหมวดไหน

1. **Database-per-service** — ห้าม service ไหน query ข้าม schema ของ service อื่นตรงๆ ต้องคุยผ่าน API หรือ event เท่านั้น (ดูเหตุผลใน `design.md`)
2. **Snapshot pattern** — ข้อมูลใน `orders` / `order_items` (ราคา, ที่อยู่) ต้อง freeze ณ ตอนสั่งซื้อเสมอ ห้าม join ไป product/address ตรงๆ ตอนแสดงประวัติ
3. **ห้ามแก้ `inventory.quantity` ตรงๆ** — ทุกการเปลี่ยนแปลงสต็อกต้อง insert `inventory_logs` คู่กันเสมอ (receive / adjust / reserve / release / sale_deduct)
4. **RBAC ตาม role จริง** — Customer / Staff / Admin เห็นข้อมูลคนละระดับ โดยเฉพาะข้อมูลการเงิน (ดูตาราง RBAC ใน `design.md`) ห้าม endpoint ไหนคืนข้อมูลเกินสิทธิ์ของ role ที่เรียก
5. **Event ใช้ QStash ไม่ใช่ raw Redis pub/sub** — เพราะ Cloudflare Workers เป็น stateless function รับ event ผ่าน webhook เท่านั้น (ดู flow เต็มใน `backend/skill.md`)

## Tech Stack สรุปย่อ

| หมวด | เทคโนโลยี |
|---|---|
| Frontend | Next.js + TypeScript ผ่าน Vinext, Tailwind CSS, shadcn/ui |
| Backend | Node.js + Hono บน Cloudflare Workers |
| ORM / DB | Prisma + adapter-neon, PostgreSQL (Neon) |
| Cache | Redis (Upstash) — ใช้ทำ Cart |
| Event Queue | Upstash QStash — ใช้ทำ async notification |
| Storage รูปภาพ | Cloudflare R2 |
| Auth | Kinde SDK |
| Validation | Zod (ใช้ร่วมกันทั้ง frontend/backend ผ่าน shared package) |
| Payment | Omise SDK (sandbox) |
| Deploy Frontend | Cloudflare Pages |
| Deploy Backend | Cloudflare Workers |
| Monorepo | Turborepo |

## หลักการตั้งชื่อ (Naming Convention) ทั้งโปรเจกต์

- ตารางฐานข้อมูล: `camelCase` พหูพจน์ เช่น `orderItems`, `inventoryLogs`, `productImages`
- field ในตาราง: `camelCase` เช่น `customerId`, `createdAt`
- Route/endpoint: `kebab-case` เช่น `/inventory/receive`, `/back-in-stock`
- Component React: `PascalCase` เช่น `ProductCard.tsx`
- Service folder: `kebab-case` + `-svc` เช่น `order-svc`, `notification-svc`

> หมายเหตุ: table name เปลี่ยนจาก `snake_case` เป็น `camelCase` แล้ว เพื่อให้ตรงกับ field convention และไม่ต้อง map ชื่อไปมาเวลาทำงานกับ Prisma/Drizzle — ถ้าต้องอัปเดตไฟล์ data schema (JSON) กับ UAT ให้ table name ตรงกันด้วย บอกได้เลย ตอนนี้ไฟล์นั้นยังเป็น `snake_case` อยู่
