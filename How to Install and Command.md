# 🚀 Onboarding Guide — MusicGear

คู่มือ setup โปรเจกต์ครั้งแรก สำหรับสมาชิกทีมทุกคน

---

## 1️⃣ ติดตั้งเครื่องมือพื้นฐาน

```bash
# ติดตั้งและสลับไปใช้ Node.js v22
nvm install 22
nvm use 22

# ติดตั้ง pnpm แบบ global
npm install -g pnpm
```

## 2️⃣ Clone โปรเจกต์

```bash
git clone <repo-url>
cd musicgear
git checkout dev
```

## 3️⃣ ติดตั้ง Dependencies

```bash
# รันที่ root ของ monorepo เท่านั้น
pnpm install
```

## 4️⃣ ตั้งค่า Environment Variables

นำไฟล์ `.dev.vars` / `.env` ของ service ที่ได้รับมอบหมาย (อยู่ใน Discord) มาวางไว้ใน folder ของ service นั้นๆ

```
services/<ชื่อ-service>/.env
services/<ชื่อ-service>/.dev.vars
```

## 5️⃣ อ่านเอกสารก่อนเริ่มงาน

อ่านตามลำดับนี้:

1. งานที่ได้รับมอบหมาย (ดูจาก `team_work_plan.md`)
2. `docs/skill.md`
3. `docs/structure.md`
4. `docs/frontend/skill.md` **หรือ** `docs/backend/skill.md` — เลือกตามฝั่งที่รับผิดชอบ

## 6️⃣ เริ่มทำงาน

```bash
pr feature เข้า dev เท่านั้น

# สร้าง branch ใหม่จากชื่องานของตัวเอง
git checkout -b feature/<ชื่อ>
```

เริ่มทำตาม Phase ที่ระบุไว้ใน `team_work_plan.md`

---

## ▶️ คำสั่งรันโปรเจกต์

| คำสั่ง | ใช้เมื่อ |
|---|---|
| `pnpm dev` หรือ `pnpm turbo dev` | รันทุก service/app พร้อมกันทั้งหมด |
| `pnpm dev:frontend` | รันเฉพาะฝั่ง frontend (apps/*) |
| `pnpm dev:backend` | รันเฉพาะฝั่ง backend (services/*) |
| `pnpm turbo dev --filter=<ชื่อ>` | รันเฉพาะ service/app ตัวเดียว เช่น `pnpm turbo dev --filter=admin` |
