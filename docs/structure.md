# structure.md — Monorepo Folder Structure (Turborepo)

```
musicgear/
├── apps/
│   ├── web/                  # Customer Web App (Vinext)
│   ├── admin/                 # Admin Portal (Vinext)
│   └── staff/                  # Staff Portal (Vinext)
│
├── services/                  # Backend microservices — Hono บน Cloudflare Workers
│   ├── auth-svc/
│   ├── user-svc/
│   ├── product-svc/            # รวม inventory + inventory_logs
│   ├── cart-svc/
│   ├── order-svc/
│   ├── payment-svc/
│   ├── notification-svc/
│   └── report-svc/
│
├── packages/                  # โค้ดที่ใช้ร่วมกันข้าม apps/services
│   ├── database/                # Prisma schema ของแต่ละ service + Neon client
│   ├── ui/                      # shadcn components + design tokens (designsystem.md)
│   ├── types/                   # Zod schemas + shared TypeScript types
│   ├── config/                  # eslint, tsconfig, tailwind config กลาง
│   └── api-client/              # typed fetch wrapper เรียก API Gateway แต่ละ service
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

## โครงสร้างภายในแต่ละ `services/*` (Hono)

```
services/product-svc/
├── src/
│   ├── routes/
│   │   ├── products.ts
│   │   ├── inventory.ts        # receive/adjust/check stock + inventory_logs
│   │   └── bundles.ts
│   ├── services/                # business logic แยกจาก route handler
│   │   ├── product.service.ts
│   │   └── inventory.service.ts
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema เฉพาะ table ที่ service นี้เป็นเจ้าของ
│   │   └── client.ts
│   ├── middleware/
│   │   ├── auth.ts                # verify Kinde JWT
│   │   └── rbac.ts                 # guard ตาม role
│   ├── events/
│   │   └── publishStockUpdated.ts  # publish ไป QStash
│   └── index.ts                    # Hono app entry
├── wrangler.toml
├── package.json
└── drizzle.config.ts
```

## กฎการวางไฟล์

- ห้าม service ไหน import schema/client ของ service อื่นโดยตรงจาก `packages/database` — แต่ละ service เห็นเฉพาะ schema namespace ของตัวเอง
- Component ที่ใช้มากกว่า 1 app ต้องย้ายไป `packages/ui` ไม่ copy-paste ข้าม app
- Zod schema ที่ทั้ง frontend (form validation) และ backend (request validation) ใช้ร่วมกัน ต้องอยู่ใน `packages/types` เท่านั้น เพื่อไม่ให้ schema สองฝั่งหลุด sync กัน
