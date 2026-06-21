# frontend/skill.md — Frontend (Customer / Staff / Admin Portal)

> ใช้คู่กับ `structure.md` (path) และ `designsystem.md` (สี/spacing) — ไฟล์นี้เน้นกฎการเขียนโค้ดฝั่ง frontend โดยเฉพาะ

## Stack

Vinext (Next.js App Router API surface บน Vite) + TypeScript + Tailwind CSS + shadcn/ui, deploy บน Cloudflare Pages

## 1. Routing & Slug

ทุก URL หน้าสินค้าใช้ `slug` ไม่ใช่ `productId` — ตรงกับ field ที่เพิ่มใน schema

```
/product/[slug]/page.tsx     ✅
/product/[id]/page.tsx       ❌ ห้ามใช้ UUID ใน URL (เสีย SEO)
```

ฝั่ง backend ต้องมี endpoint `GET /products/by-slug/:slug` แยกจาก `GET /products/:id` ให้ frontend เรียกใช้

## 2. Component Convention

- Server Component เป็น default — ใช้ Client Component (`"use client"`) เฉพาะที่ต้อง interactive จริงๆ (form, cart, filter)
- ตั้งชื่อไฟล์ component เป็น `PascalCase.tsx` เช่น `ProductCard.tsx`, `CompareTable.tsx`
- Component ที่ reusable ข้าม 2 app ขึ้นไป ต้องย้ายเข้า `packages/ui` ทันที ห้าม copy-paste

## 3. Data Fetching

ห้ามยิง `fetch()` ตรงๆ ใน component — เรียกผ่าน `packages/api-client` เท่านั้น เพื่อให้ type-safe และจัดการ auth header (Kinde JWT) ที่จุดเดียว

```ts
// lib/api.ts
import { getProductBySlug } from "@musicgear/api-client";

const product = await getProductBySlug(slug);
```

## 4. Form & Validation

ใช้ `react-hook-form` + `zodResolver` เสมอ และ Zod schema ต้อง import มาจาก `packages/types` (schema เดียวกับที่ backend ใช้ validate request) — ห้ามเขียน validation rule ซ้ำคนละชุดระหว่าง frontend/backend

## 5. รูปภาพสินค้า (sortOrder)

แสดงรูปสินค้าตาม `sortOrder` ascending เสมอ (0 = รูปปก) ใช้ component `ProductGallery` กลางใน `packages/ui` ไม่เขียน logic เรียงรูปซ้ำในแต่ละหน้า

## 6. Auth & Role Guard

- Customer Web App: ใช้ Kinde client SDK, route ที่ต้อง login ห่อด้วย middleware เช็ค session
- Staff/Admin Portal: เพิ่มชั้น role guard บน top-level layout — เช็ค role จาก JWT claim ก่อน render เนื้อหาใดๆ (ไม่ใช่แค่ซ่อนเมนู UI เพราะฝั่ง backend ก็ต้องเช็คซ้ำอยู่แล้วตาม RBAC ใน `design.md`)

## 7. State ของ Cart

Cart เป็น server state เสมอ (เก็บใน `cart-svc` ผ่าน Redis) — ไม่เก็บใน localStorage/sessionStorage ฝั่ง client เพื่อให้ guest cart กับ login cart merge กันได้ถูกต้องตอน login

## 8. Notification UI

หน้า notification ของ customer ต้องใช้ `productId` (ที่เพิ่มเข้า schema) ทำลิงก์คลิกไปหน้าสินค้าได้โดยตรงเมื่อ `type = back_in_stock` หรือ `promotion` — ถ้า `productId` เป็น null (เช่น `order_update`, `system`) ไม่ต้อง render ลิงก์สินค้า

## 9. ภาษา

UI หลักเป็นภาษาไทย ข้อความปุ่ม/ label เขียนเป็นภาษาที่เข้าใจง่าย ไม่ใช้ศัพท์เทคนิคเกินจำเป็น (ตรงกับ Persona "นัท" ในเอกสารหลัก)
