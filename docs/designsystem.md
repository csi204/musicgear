# designsystem.md — "Electric Stage" Design System

> ใช้ไฟล์นี้เวลาทำ UI ทุกครั้ง ไม่ต้องเดาสีหรือเดา spacing เอง — ทุกค่าตั้งเป็น CSS variable ใน `packages/ui` แล้วทุก app import ใช้ร่วมกัน

## แนวคิด

ผสานความดิบเท่ของเวทีดนตรี (ดำ/เทาเข้ม) เข้ากับความทันสมัยของแบรนด์เทค (ฟ้าไฟฟ้า) แต่งแต้มพลังด้วยสีอำพันแบบไฟสปอตไลต์บนเวที

## 1. Color Palette

| Token | Hex | บทบาท | ใช้ที่ไหน |
|---|---|---|---|
| `--color-jet-black` | `#0B0B0E` | Primary / Base | พื้นหลังหลัก, Header, Footer, Staff/Admin Portal |
| `--color-electric-blue` | `#2F5DFF` | Primary Accent | ปุ่ม CTA, ลิงก์, โลโก้, สถานะ active |
| `--color-amber-spotlight` | `#FF8A3D` | Secondary Accent | ป้ายลดราคา, แจ้งเตือน Staff/Admin, ไฮไลต์สำคัญ |
| `--color-warm-offwhite` | `#F5F3EE` | Surface / Background | พื้นหลังการ์ดสินค้า, Customer Web App (light mode) |
| `--color-slate-gray` | `#6B6B74` | Neutral / Text | ข้อความรอง, เส้นแบ่ง, placeholder |
| `--color-success-green` | `#2BBF7A` | Feedback | สถานะสำเร็จ, ของพร้อมส่ง, Payment success |
| `--color-alert-red` | `#E54848` | Feedback | สต็อกหมด, ยกเลิกออเดอร์, Error |

### Theming ต่อ Portal

| Portal | Background | Accent | Mode |
|---|---|---|---|
| Customer Web App | `--color-warm-offwhite` | `--color-electric-blue` | Light |
| Staff Portal | `--color-jet-black` | `--color-amber-spotlight` | Dark |
| Admin Portal | `--color-jet-black` | `--color-electric-blue` | Dark |

### Status Color Mapping (ผูกกับ enum ใน schema)

| Enum value | สี | ใช้กับ field |
|---|---|---|
| `pending` | Slate Gray | `orders.status`, `payments.status` |
| `confirmed` / `paid` / `active` | Electric Blue | `orders.status`, `payments.status`, `products.status` |
| `packed` / `shipped` / `in_transit` | Amber Spotlight | `orders.status`, `shipments.shippingStatus` |
| `delivered` | Success Green | `orders.status`, `shipments.shippingStatus` |
| `cancelled` / `refunded` / `failed` / `out_of_stock` | Alert Red | `orders.status`, `payments.status`, `products.status` |

## 2. Typography

| Token | Font size | Weight | ใช้กับ |
|---|---|---|---|
| `--text-h1` | 32px | 700 | หัวข้อหน้า (Page title) |
| `--text-h2` | 24px | 600 | หัวข้อ section |
| `--text-h3` | 18px | 600 | หัวข้อ card |
| `--text-body` | 16px | 400 | เนื้อหาทั่วไป |
| `--text-small` | 14px | 400 | label, helper text |
| `--text-caption` | 12px | 400 | timestamp, metadata |

Font family: `Inter` (หรือ `Noto Sans Thai` สำหรับข้อความไทยล้วน — ใช้ font stack `'Inter', 'Noto Sans Thai', sans-serif`)

## 3. Spacing Scale

ใช้ฐาน 4px ทั้งระบบ: `4, 8, 12, 16, 24, 32, 48, 64` px (Tailwind default scale ตรงกันอยู่แล้ว ใช้ `p-1` ถึง `p-16` ได้เลย ไม่ต้องสร้าง custom scale ใหม่)

## 4. Border Radius & Shadow

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--radius-sm` | 6px | input, badge |
| `--radius-md` | 10px | button, card เล็ก |
| `--radius-lg` | 16px | card สินค้า, modal |
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | การ์ดบน light mode เท่านั้น (dark mode ใช้ border แทน shadow) |

## 5. Component Tokens (shadcn/ui override)

```css
:root {
  --primary: var(--color-electric-blue);
  --secondary: var(--color-amber-spotlight);
  --background: var(--color-warm-offwhite);
  --foreground: var(--color-jet-black);
  --destructive: var(--color-alert-red);
  --success: var(--color-success-green);
  --muted: var(--color-slate-gray);
}

[data-theme="dark-portal"] {
  --background: var(--color-jet-black);
  --foreground: var(--color-warm-offwhite);
}
```

ตั้งค่านี้ใน `packages/ui/tailwind.config.ts` ครั้งเดียว ทุก app (`apps/web`, `apps/admin`, `apps/staff`) extend จากไฟล์เดียวกัน ห้าม hardcode hex code ในแต่ละ component

## 6. Icon

ใช้ชุดเดียวทั้งระบบ — `lucide-react` (มีอยู่แล้วใน shadcn/ui stack) ไม่ผสมไอคอนชุดอื่น สำคัญห้ามใช้emoji เด็ดขาด svg หรือใน shadcn/ui เท่านั้น

## 7. Reference

ตัวอย่างผลลัพธ์เดิมจาก Figma: ดูที่ Wireframe/Prototype link ในเอกสารหลักของกลุ่ม 
linkDevMode : https://www.figma.com/design/RSQ1FfYVF5qJZzgem9ntBt/Untitled?node-id=0-1&m=dev&t=0sTXigQdnyt3ccY7-1
LinkEdit : https://www.figma.com/design/RSQ1FfYVF5qJZzgem9ntBt/Untitled?node-id=0-1&t=0sTXigQdnyt3ccY7-1

## 8. Monitor/Responsive

มือถือ, แท็บเลต, Desktop