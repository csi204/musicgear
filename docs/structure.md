# structure.md — Monorepo Folder Structure (Turborepo)

```
musicgear/
├── apps/
│   ├── web/                  # Customer Web App (Vinext)
│   ├── admin/                 # Admin Portal (Vinext)
│   └── staff/                  # Staff Portal (Vinext)
│
├── services/                  # Backend microservices — Hono บน Cloudflare Workers (JavaScript ล้วน ไม่ใช่ TypeScript)
│   ├── api-gateway/             # จุดเดียวที่ frontend เรียก, route ผ่าน Service Binding
│   ├── auth-svc/
│   ├── user-svc/
│   ├── product-svc/            # รวม inventory + inventory_logs
│   ├── cart-svc/
│   ├── order-svc/
│   ├── payment-svc/
│   ├── notification-svc/        # QStash subscriber
|   ├── inventory-svc/             
│   └── report-svc/              # QStash subscriber เหมือนกัน (fan-out topic เดียวกับ notification-svc)
│
├── packages/                  # โค้ดที่ใช้ร่วมกันข้าม apps/services
│   ├── database/                # แค่ helper เล็กๆ (createPrismaClient) — schema.prisma จริงอยู่ "ในแต่ละ service" ไม่ใช่ที่นี่
│   ├── ui/                      # shadcn components (preset: Nova) + design tokens (designsystem.md)
│   ├── types/                   # Zod schemas — เขียนเป็น plain JS เพื่อให้ทั้ง frontend(TS)/backend(JS) ใช้ร่วมกันได้
│   ├── config/                  # tsconfig (เฉพาะ apps/* + packages/ui), eslint config แยกสำหรับ services/* (JS)
│   └── api-client/               # typed fetch wrapper เรียก api-gateway ตัวเดียว ไม่เรียก service ภายในตรงๆ 
│
├── docs/                      # เอกสารโปรเจกต์ (ไฟล์ที่อยู่ในชุดนี้ทั้งหมด)
│   ├── skill.md
│   ├── design.md
│   ├── designsystem.md
│   ├── structure.md
│   ├── frontend/skill.md
│   └── backend/skill.md
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## โครงสร้างภายในแต่ละ `apps/*` (Vinext)

```
apps/web/
├── app/                      # Routes (Vinext ใช้ Next.js App Router API surface)
│   ├── (customer)/
│   │   ├── products/
│   │   │   └── [slug]/page.tsx     # ใช้ slug ไม่ใช่ UUID ตาม patch schema
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── orders/[id]/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                   # re-export จาก packages/ui
│   └── features/             # component เฉพาะ feature เช่น ProductCard, CompareTable
├── lib/
│   ├── api.ts                 # import จาก packages/api-client
│   └── auth.ts                # Kinde client setup
├── hooks/
└── wrangler.toml (ถ้า deploy เป็น Worker) หรือ cloudflare pages config
```

## โครงสร้างภายในแต่ละ `services/*` (Hono, JavaScript)

```
services/product-svc/
├── src/
│   ├── routes/
│   │   ├── products.js
│   │   ├── inventory.js        # receive/adjust/check stock + inventory_logs
│   │   └── bundles.js
│   ├── services/                # business logic แยกจาก route handler
│   │   ├── product.service.js
│   │   └── inventory.service.js
│   ├── middleware/
│   │   ├── auth.js                # verify Kinde JWT
│   │   └── rbac.js                 # guard ตาม role
│   ├── events/
│   │   └── publishStockUpdated.js  # publish ไป QStash (ไปยัง notification-svc และ report-svc)
│   └── index.js                    # Hono app entry
├── prisma/
│   └── schema.prisma                # schema ของ service นี้เท่านั้น ชี้ไปที่ Neon project ของตัวเอง
├── .env                              # DATABASE_URL เฉพาะของ Neon project "product-svc"
├── .dev.vars                         # ค่าเดียวกับ .env แต่ใช้ตอนรัน wrangler dev (gitignored)
├── wrangler.toml
└── package.json
```

## กฎการวางไฟล์

- ห้าม service ไหน import schema/client ของ service อื่นโดยตรงจาก `packages/database` — แต่ละ service เห็นเฉพาะ schema namespace ของตัวเอง
- Component ที่ใช้มากกว่า 1 app ต้องย้ายไป `packages/ui` ไม่ copy-paste ข้าม app
- Zod schema ที่ทั้ง frontend (form validation) และ backend (request validation) ใช้ร่วมกัน ต้องอยู่ใน `packages/types` เท่านั้น เพื่อไม่ให้ schema สองฝั่งหลุด sync กัน
