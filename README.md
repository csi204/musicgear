# 🎸 MusicGear — Project Design Document
> ## Project of CSI 204 Summer Semester 3/2568

> ระบบ E-Commerce สำหรับร้านขายเครื่องดนตรีและอุปกรณ์ดนตรีออนไลน์ รองรับ 3 บทบาทผู้ใช้งาน: **Customer, Staff, Admin**

github page: [GitHub Page](https://csi204.github.io/musicgear/)

---

## 📚 สารบัญ

1. [Contributors](#-contributors)
2. [หลักการและเหตุผล (Rationale)](#-หลักการและเหตุผล-rationale)
3. [วัตถุประสงค์ของโครงงาน (Objectives)](#%EF%B8%8F-วัตถุประสงค์ของโครงงาน-objectives)
4. [ขอบเขตของระบบ (System Scope)](#-หลักการและเหตุผล-rationale)
5. [แนวทางของการพัฒนาตาม SDLC (System Development Life Cycle))](#%E2%80%8D-แนวทางของการพัฒนาตาม-sdlc-system-development-life-cycle)
7. [Tech Stack](#-tech-stack)
8. [แนวทางการทดสอบ (Testing Approach)](#%EF%B8%8F-แนวทางการทดสอบ-testing-approach)
9. [ผลลัพธ์ที่คาดว่าจะได้รับ (Expected Outcomes)](#%EF%B8%8F-ผลลัพธ์ที่คาดว่าจะได้รับ-expected-outcomes)
10. [แผนการดำเนินงาน 4 สัปดาห์ (Work Plan: 4 Weeks)](#%EF%B8%8F-แผนการดำเนินงาน-4-สัปดาห์-work-plan-4-weeks)
11. [Brand Identity & Color Palette](#-brand-identity--color-palette)
12. [Requirement](#-requirment)
13. [User Personas](#-user-personas)
14. [Use Case Diagram](#-use-case-diagram)
15. [Class Diagram](#%EF%B8%8F-class-diagram)
16. [Sequence Diagrams](#-sequence-diagrams)
17. [Wireframe](#-wireframe--prototype---clik-to-inspect)
18. [System Architecture](#%EF%B8%8F-system-architecture)
19. [Data schema](#data-schema-json)
20. [User Accept Testing: UAT (Manual Testing)](#user-acceptance-testing-uat-manual-testing)

---

## 🤼 Contributors

### Group Name : องครักษ์พิทักษ์ลาบ
1. 67095474 นายธีรภัทร เนียมสุวรรณ SA, Core Backend
2. 67096366 นายปวริศ ธรรมวงษ์ Frontend, Backend lead
3. 67118456 นายเขตโสภณ อินอุตออน PM, infrastructure

---

## 💭 หลักการและเหตุผล (Rationale)

ปัจจุบันตลาดเครื่องดนตรีและอุปกรณ์ ออนไลน์มีการขยายตัวสูง แต่ร้านค้าส่วนใหญ่ยังขาดแพลตฟอร์มที่มี การจัดการที่ครอบคลุมครบวงจรยังมีน้อยอยู่ โครงงานนี้จึงมุ่งพัฒนาระบบด้วยสถาปัตยกรรม Microservices ที่มีความสามารถในการรองรับการขยายตัวของระบบได้ดี เพื่อจัดการ สต๊อกสินค้า, ระบบชำระเงินที่ปลอดภัย, และเพิ่มการดึงดูดความสนใจของผู้ใช้ ผ่านระบบแนะนำสินค้าและ Bundle Set

---

## 🗃️ วัตถุประสงค์ของโครงงาน (Objectives)

1. เพื่อพัฒนาระบบรวบรวมและจัดเก็บข้อมูลอุปกรณ์ดนตรีจากแหล่งข้อมูลออนไลน์ให้อยู่ในรูปแบบที่เป็นระบบ
2. เพื่อพัฒนาระบบแนะนำอุปกรณ์ดนตรีสำหรับผู้เริ่มต้น โดยพิจารณาจากความต้องการและงบประมาณของผู้ใช้งาน
3. เพื่อช่วยลดความสับสนในการเลือกซื้ออุปกรณ์ดนตรี และเพิ่มความมั่นใจในการตัดสินใจของผู้ใช้งาน

---

## 📑 ขอบเขตของระบบ (System Scope)

### ผู้ใช้งาน (Actors)
- [x] ลูกค้า (Customer)
- [x] พนักงาน (Staff)
- [x] ผู้ดูแลระบบ (Administrator)

### ความสามารถหลักของระบบ (Main Function)
1. การจัดการสมาชิก (Register/Login)
2. การจัดการข้อมูลสินค้า
3. การค้นหาและแสดงรายละเอียดสินค้า
4. ระบบตะกร้าสินค้า (Shopping Cart)
5. ระบบสั่งซื้อสินค้า (Order Management)
6. ระบบชำระเงิน (Simulation/Mockup - Stripe/Omise sandbox)
7. ระบบติดตามสถานะคำสั่งซื้อ
8. ระบบจัดการสินค้าและคำสั่งซื้อสำหรับ Staff/Admin
9. รายงาน/Dashboard
10. ระบบแนะนำอุปกรณ์ที่เหมาะสำหรับมือใหม่ (Beginner)
11. ระบบแนะนำสินค้าที่ใช้ร่วมกันได้ + Bundle Set
12. ระบบเปรียบเทียบสินค้า (Compare Product)

---

## 🧑‍💻 แนวทางของการพัฒนาตาม SDLC (System Development Life Cycle)

| ขั้นตอน (Phase) | รายละเอียดโดยย่อ (Brief Description) |
|---|---|
| **1.Planing** | กำหนด Scope และประเมิน ความเป็นไปได้ ของโปรเจกต์ |
| **2.Analysis** | มีการกำหนดความต้องการและระบุขอบเขตของการพัฒนาโดยนำ UMLมาใช้วิเคราห์ เช่น Class diagram, Use case diagram, Sequence diagram  |
| **3.Design** | ออกแบบฐานข้อมูลโดยใช้ ER diagramมาช่วยออกแบบหน้าบ้านผู้ใช้โดยการนำFigmaเข้ามาช่วย ออกแบบหลังบ้านโดยใช้การออกแบบsystem architecture เข้ามาช่วย |
| **4.Development** | ลงมือ Implement เขียนโค้ดสร้างระบบ สร้างฐานข้อมูล เขียนโค้ดส่วนหน้าและหลังบ้าน ตามที่วิเคราะห์ไว้ |
| **5.Testing** | Testด้วยมือด้วยวิธีการการ UAT |
| **6.Deployment** | เอาโค้ดขึ้น Production สภาพแวดล้อมระบบที่ใช้งานจริงให้Users เข้ามาใช้ |
| **7.Maintenance** | คอย Monitor ติดตาม ระบบ อัปเดตเวอร์ชัน และแก้ไขปัญหา หลังเปิดใช้งาน |

---

## 🧰 Tech Stack

| หมวด | เทคโนโลยี | รายละเอียด |
|---|---|---|
| **Frontend** | Next.js + TypeScript | Framework: Vinext |
| **Backend** | Node.js (JavaScript) | Runtime |
| **Backend Framework** | Hono | Lightweight backend framework |
| **ORM** | Prisma (+ adapter-neon) | จัดการฐานข้อมูล |
| **Database** | PostgreSQL (Neon DB) | Serverless Postgres |
| **Storage Images** | Cloudflare R2 | ตัวเก็บรูป |
| **Caching** | Redis (Upstash) | สำหรับทำcart(caching) |
| **Resend** | Resend | ระบบ ส่งอีเมลล์เพื่อเปลี่ยนรหัสผ่าน |
| **Validation** | Zod | Validate ข้อมูล |
| **Payment** | Omise SDK | ระบบชำระเงิน |
| **Styling** | Tailwind CSS + shadcn/ui | ออกแบบ UI และ component |
| **Deployment (Frontend)** | Cloudflare Workers | โฮสต์ฝั่ง frontend |
| **Deployment (Backend)** | Cloudflare Workers | โฮสต์ฝั่ง backend |
| **DevOps** | Wrangler CLI, Git, GitHub | Deploy & version control |
| **API Testing** | Postman | ทดสอบ API |
| **Design** | Figma | ออกแบบ UI/UX |
| **Version Control** | GIT,GitHub | History,VersionControl |

---

## ⚙️ แนวทางการทดสอบ (Testing Approach)
### ประเภทการทดสอบ (Test Types)
- **User Acceptance Testing (UAT)**
### เครื่องมือที่ใช้คือ (Tools)
- **Manual Testing**
### รายละเอียดการทดสอบ (Testing Details)
- **ไม่วัดผลจากการใช้เครื่องมือทดสอบอัตโนมัติ หรือการจัดทำรายงานผลการทดสอบอย่างเป็นทางการ**
- การทดสอบการทำงานของระบบ โดยอธิบายขั้นตอนการทดสอบ ผลลัพธ์ที่คาดหวัง และผลลัพธ์ที่เกิดขึ้นจริง เพื่อแสดงให้เห็นว่าระบบสามารถทำงานได้ถูกต้องตามวัตถุประสงค์ที่กำหนดไว้ รวมถึงการทดสอบการทำงานของระบบด้วยตนเอง (Manual Testing) ตามฟังก์ชันต่าง ๆ ที่ได้พัฒนาขึ้น พร้อมทั้งสาธิตการทำงานของระบบต่อผู้สอน เพื่อยืนยันความถูกต้อง ความสมบูรณ์ และประสิทธิภาพของระบบในการใช้งานจริง

---

## 🖼️ ผลลัพธ์ที่คาดว่าจะได้รับ (Expected Outcomes)
### ระบุประโยชน์ที่คาดว่าจะได้รับจากการพัฒนาระบบ
- **ได้เว็บแอป e-commerce สำหรับขาย music gear ที่ใช้งานได้จริง(90%)ครบ flow ตั้งแต่ค้นหาสินค้า → ตะกร้า → ชำระเงิน สำเร็จ**
- **ผู้ใช้ (ลูกค้า/พนักงาน/แอดมิน) สามารถเข้าระบบตาม role ของตนเองได้ พร้อม Dashboard(admin,staff) สรุปข้อมูลเชิงวิเคราะห์สำหรับแอดมิน**
- **ระบบจัดการสต็อกสินค้าที่อัปเดตสถานะอัตโนมัติเมื่อมีการสั่งซื้อ ลดความผิดพลาดจากการจัดการสต็อกแบบ manual**
- **ทีมได้ฝึกกระบวนการพัฒนาตาม Agile/Scrum จริง (4 sprints) และได้ codebase ที่ deploy บน Cloudflare stack ตามที่ออกแบบไว้**

---

## 🗺️ แผนการดำเนินงาน 4 สัปดาห์ (Work Plan: 4 Weeks)
| สัปดาห์ (Week) | กิจกรรม (Activities) | รายละเอียดโดยย่อ (Brief Description) |
|:---:|---|---|
| **1** | **วิเคราะห์และออกแบบระบบ (Analysis & Design)** | วางแผนว่าจะทำอะไร แบ่งหน้าที่ ออกแบบdiagram ออกแบบtech stack ทำยังไงให้เว็บเร็วและ setup file |
| **2** | **พัฒนา Backend และฐานข้อมูล (Backend & Database Development)** | ทำตามwork flow ที่กำหนดไว้ และtest api เพื่อนำไปต่อกับ frontend และต่อdatabase จากนั้นdeploy |
| **3** | **พัฒนา Frontend (Frontend development)** | ทำตามprototype ที่ทำไว้ และรอต่อapi จาก backendจากนั้น deploy |
| **4** | **ทดสอบระบบและนำเสนอผลงาน (Testing & Presentation)** | เตรียมการนำเสนอ และ ทดสอบUAT ตามส่วนที่ตัวเองรับผิดชอบ |

---

## 🎨 Brand Identity & Color Palette

แนวคิด: **"Electric Stage"** — ผสานความดิบเท่ของเวทีดนตรี (สีดำ/เทาเข้ม) เข้ากับความทันสมัยของแบรนด์เทค (สีฟ้าไฟฟ้า) แล้วแต่งแต้มพลังด้วยสีอำพันแบบไฟสปอตไลต์บนเวที เพื่อสื่อถึงทั้งความพรีเมียมของเครื่องดนตรีและความเป็นแพลตฟอร์มอีคอมเมิร์ซยุคใหม่

| สี | Hex | บทบาท | การใช้งาน |
|---|---|---|---|
| 🖤 **Jet Black** | `#0B0B0E` | Primary / Base | พื้นหลังหลัก, Header, Footer, โหมดมืดของเว็บ |
| 💙 **Electric Blue** | `#2F5DFF` | Primary Accent | ปุ่ม CTA, ลิงก์, โลโก้, สถานะ active, ไอคอนหลัก |
| 🧡 **Amber Spotlight** | `#FF8A3D` | Secondary Accent | ป้ายลดราคา/โปรโมชัน, แจ้งเตือน Staff/Admin, ไฮไลต์สำคัญ |
| 🤍 **Warm Off-White** | `#F5F3EE` | Surface / Background | พื้นหลังการ์ดสินค้า, พื้นที่เนื้อหาในโหมดสว่าง |
| ⚪ **Slate Gray** | `#6B6B74` | Neutral / Text | ข้อความรอง, เส้นแบ่ง, placeholder |
| 🟢 **Success Green** | `#2BBF7A` | Feedback | สถานะสำเร็จ, ของพร้อมส่ง, Payment success |
| 🔴 **Alert Red** | `#E54848` | Feedback | สต็อกหมด, ยกเลิกออเดอร์, Error |

**โทนการใช้งานแยกตามบทบาท**
- **Customer (Web App):** พื้นหลังขาวอุ่น (`#F5F3EE`) + ฟ้าไฟฟ้าเป็นจุดเด่น ให้ความรู้สึกสะอาด เลือกซื้อง่าย
- **Staff Portal:** โทนมืด (`#0B0B0E`) + อำพันเป็นตัวเน้นงาน เพื่อเน้นการอ่านสถานะ/แจ้งเตือนได้ไว
- **Admin Portal:** โทนมืด + ฟ้าไฟฟ้า เน้นกราฟ/ดาต้า ให้ดูเป็นระบบ Dashboard ระดับโปร

---

## 📃 Requirment

Requirement หลักของระบบ (ตามเกณฑ์ - ครบทุกข้อ):
1. การจัดการสมาชิก (Register/Login)
2. การจัดการข้อมูลสินค้า
3. การค้นหาและแสดงรายละเอียดสินค้า
4. ระบบตะกร้าสินค้า (Shopping Cart)
5. ระบบสั่งซื้อสินค้า (Order Management)
6. ระบบชำระเงิน (Simulation/Mockup - Stripe/Omise sandbox)
7. ระบบติดตามสถานะคำสั่งซื้อ
8. ระบบจัดการสินค้าและคำสั่งซื้อสำหรับ Staff
9. รายงาน/Dashboard
10. ระบบแนะนำอุปกรณ์ที่เหมาะสำหรับมือใหม่ (Beginner)
11. ระบบแนะนำสินค้าที่ใช้ร่วมกันได้ + Bundle Set
12. ระบบเปรียบเทียบสินค้า (Compare Product)

---

## 👥 User Personas

### 🧑‍🎤 Persona 1 — Customer: "นัท"
**อายุ:** 19 ปี | นักศึกษาปีที่ 1 | **เป้าหมาย:** เล่นกีตาร์ให้เก่ง — มือใหม่ในวงการดนตรี

> *"ผมอยากหัดเล่นดนตรีจริงจัง แต่พอหาของในเน็ตทีไรก็ตัวเลือกมันแถมสเปกอะไรก็ไม่รู้ ดูเป็นไม่ค่อยรู้ว่าแค่ไหนถึงคุ้ม"*

**🩹 Pain Points**
- เลือกของไม่ถูก ตัวเลือกจัดจ้องไปหมด ไม่มีไกด์ให้มือใหม่เริ่มต้นถูกจุด
- แพ็กเกจเริ่มต้นของไม่เข้ากัน ซื้อมาแล้วต่อกันไม่ได้ อุปกรณ์ขึ้นไม่ได้กับมือใหม่
- ไม่ชัวร์เรื่องความคุ้ม ไม่รู้ว่าราคานี้มันได้ของดีจริงไหม
- ข้อมูลเทคนิคยุ่งยากเกินไป อ่านรายละเอียดสินค้าแล้วยังไม่เข้าใจ

**🎯 Needs & Motivations**
- ระบบช่วยแนะนำสินค้าเบื้องต้นที่เหมาะกับมือใหม่
- จัดเซ็ตเริ่มต้นมาให้ครบ ซื้อของกล่องเดียวพร้อมเล่น
- มีให้เทียบเปรียบเทียบสินค้า เพื่อตัดสินใจซื้อง่ายขึ้น
- แพ็กเกจชัดเจนบอกว่าตัวไหนเหมาะกับระดับเริ่มต้น

---

### 🔧 Persona 2 — Staff: "นอท"
**อายุ:** 23 ปี | พนักงานดูแลคลังและจัดเตรียมสินค้า | **เป้าหมาย:** จัดเตรียมสินค้าตามออเดอร์และหยิบแพ็กสินค้าส่งออกได้ถูกต้อง รวดเร็ว 100%

> *"ลูกค้าชอบสั่งสินค้าหลายชิ้นพร้อมกันเพราะกลัวว่าซื้อไปแล้วจะใช้ด้วยกันไม่ได้ แต่ในระบบคลังเราต้องมานั่งแยกเช็กทีละชิ้น ถ้าออเดอร์ไหนรายละเอียดไม่ชัดเจน ตอนไปหยิบของจะวุ่นวายและเสียเวลามาก"*

**🩹 Pain Points**
- **เสียเวลาตรวจสอบความถูกต้อง:** เวลาลูกค้าสั่งสินค้าแบบจัดเซ็ต (Bundle) พนักงานต้องมานั่งเช็กทีละชิ้นว่าอุปกรณ์ต่างๆ (เช่น กีตาร์ แอมป์ ขาตั้ง) มีของครบไหม ทำให้ทำงานช้าและเสี่ยงต่อการจัดของผิดพลาด
- **จัดการสต็อกสินค้าแบบเซ็ตได้ยาก:** ถ้ารายการใดรายการหนึ่งใน Bundle ของหมด ระบบเดิมมักจะไม่แจ้งเตือนล่วงหน้า ทำให้พนักงานต้องเดินไปเช็กที่ชั้นวางเองตอนเตรียมออเดอร์

**🎯 Needs & Motivations**
- ต้องการระบบที่แสดงสินค้าส่วนประกอบ (Bundle Items) ภายใต้เซ็ตสินค้าในใบสั่งซื้อและแสดงใบพิมพ์จัดเตรียมสินค้า (Packing Slip) เพื่อให้หยิบและบรรจุสินค้าลงกล่องได้รวดเร็วโดยไม่ต้องเดาเอง
- หน้าสรุปคลังสินค้าที่แสดงสถานะความพร้อมของเซ็ตสินค้า (พร้อมประกอบ / วัตถุดิบไม่พอ) และหน้า Dashboard ที่สรุปสถานะการเตือนภัยสต็อกต่ำ (Low Stock Alert) เพื่อเตรียมเบิกสั่งของล่วงหน้า

---

### 📊 Persona 3 — Admin: "แนท"
**อายุ:** 29 ปี | ผู้ดูแลระบบและจัดการคอนเทนต์สินค้า | **เป้าหมาย:** เพิ่ม ลบ แก้ไขข้อมูลสินค้า และจัดหมวดหมู่สินค้าให้เข้าใจง่าย เพื่อช่วยให้ลูกค้าตัดสินใจซื้อได้เร็วที่สุดโดยไม่ต้องลองถามเพิ่ม

> *"การจัดหมวดหมู่และใส่รายละเอียดสินค้าดนตรีให้มือใหม่เข้าใจง่ายเป็นเรื่องท้าทายมาก ถ้าเราไม่สามารถเชื่อมโยงสินค้าที่เข้ากันได้ ระบบข้อมูลก็จะดูรกและไม่ช่วยให้ลูกค้าตัดสินใจได้เลย"*

**🩹 Pain Points**
- **ขาดภาพรวมข้อมูลที่เข้าใจง่าย:** ปัจจุบันต้องมานั่งสรุปข้อมูลเองจากหลายๆ หน้า ไม่สามารถดูภาพรวมของระบบหรือ Export ออกมาเป็นรายงานเพื่อใช้งานต่อได้ทันที
- **วิเคราะห์การขายและสต็อกลำบาก:** การจะดูว่าสินค้าไหนขายดีเพื่อนำมาจัดโปรโมชัน หรือคำนวณว่าควรสั่งสต็อกเพิ่มไหม เป็นเรื่องที่ทำได้ยากและเสียเวลามาก เพราะระบบเดิมไม่รองรับการสกัดข้อมูลเชิงลึก

**🎯 Needs & Motivations**
- รายงานรายงานสินค้าขายดี (Sale performance)
- รายงานการเงิน (Financial)
- รายงานสินค้าคงคลัง (Inventory Report) ที่สรุปได้ว่าสินค้าคู่ไหนมักจะถูกซื้อร่วมกัน เพื่อนำมาปรับปรุงข้อมูลหน้าให้ตรงกับผู้ใช้งาน

---

## 🧩 Use Case Diagram

```mermaid
flowchart LR

    %% ── Actors ──
    User(["👤 User\n(abstract)"])
    Guest(["👤 Guest"])
    Customer(["👤 Customer"])
    Staff(["👤 Staff"])
    Admin(["👤 Admin"])

    %% Actor Generalization — ลูกศรชี้จากลูกไปหาพ่อแม่ (standard UML)
    Customer -.->|"<<generalize>>"| User
    Staff    -.->|"<<generalize>>"| User
    Admin    -.->|"<<generalize>>"| User

    %% ── Shared Use Cases (User level — ทุก role ใช้ร่วมกันผ่าน inheritance) ──
    subgraph SharedUC["User (Shared)"]
        direction TB
        UC_Login(("Login / Register"))
        UC_Logout(("Logout"))
        UC_UpdateProfile(("Update Profile"))
        UC_ChangePassword(("Change Password"))
    end

    User --- UC_Login
    User --- UC_Logout
    User --- UC_UpdateProfile
    User --- UC_ChangePassword

    %% ── Guest Use Cases ──
    subgraph GuestUC["Guest"]
        direction TB
        UC_GBrowse(("Browse Product"))
        UC_GSearch(("Search Product"))
        UC_GFilter(("Filter Product"))
        UC_GAddCart(("Add to Cart"))
        UC_GViewDetail(("View Product Detail"))
    end

    Guest --- UC_GBrowse
    Guest --- UC_GSearch
    Guest --- UC_GAddCart
    UC_GBrowse -.->|"<<extend>>"| UC_GFilter
    UC_GSearch -.->|"<<extend>>"| UC_GFilter
    UC_GAddCart -.->|"<<include>>"| UC_GViewDetail

    %% ── Customer Use Cases ──
    subgraph CustomerUC["Customer"]
        direction TB
        UC_Browse(("Browse Product"))
        UC_Search(("Search Product"))
        UC_Filter(("Filter Product"))
        UC_ViewDetail(("View Product Detail"))
        UC_Compare(("Compare Product"))
        UC_ManageCart(("Manage Cart"))
        UC_AddCart(("Add to Cart"))
        UC_ManageAddress(("Manage Address"))
        UC_Checkout(("Checkout"))
        UC_Pay(("Payment (Omise)"))
        UC_SelectPayMethod(("Select Payment Method"))
        UC_TrackOrder(("Track Order"))
        UC_OrderHistory(("Order History"))
        UC_Review(("Write Review"))
        UC_Notification(("Receive Notification"))
        UC_BackInStock(("Subscribe Back-in-Stock"))
    end

    Customer --- UC_Browse
    Customer --- UC_Search
    Customer --- UC_Compare
    Customer --- UC_ManageCart
    Customer --- UC_ManageAddress
    Customer --- UC_Checkout
    Customer --- UC_Pay
    Customer --- UC_TrackOrder
    Customer --- UC_OrderHistory
    Customer --- UC_Review
    Customer --- UC_Notification
    Customer --- UC_BackInStock

    UC_Browse -.->|"<<extend>>"| UC_Filter
    UC_Search -.->|"<<extend>>"| UC_Filter
    UC_AddCart -.->|"<<include>>"| UC_ViewDetail
    UC_ManageCart -.->|"<<include>>"| UC_AddCart
    UC_Checkout -.->|"<<include>>"| UC_ManageAddress
    UC_Pay -.->|"<<include>>"| UC_SelectPayMethod
    UC_Pay -.->|"<<include>>"| UC_Checkout

    %% ── Staff Use Cases ──
    subgraph StaffUC["Staff"]
        direction TB
        UC_ViewOrders(("View Order List"))
        UC_ConfirmOrder(("Confirm Order"))
        UC_PrepareOrder(("Prepare / Pack Order"))
        UC_UpdateOrderStatus(("Update Order Status"))
        UC_CheckStock(("Check Stock"))
        UC_ReceiveProduct(("Receive Product"))
        UC_AdjustStock(("Adjust Stock"))
        UC_ManageStock(("Manage Stock Product"))
        UC_ManageBundle(("Manage Bundle Set"))
        UC_StaffDashboard(("View Dashboard"))
    end

    Staff --- UC_ViewOrders
    Staff --- UC_ConfirmOrder
    Staff --- UC_PrepareOrder
    Staff --- UC_UpdateOrderStatus
    Staff --- UC_ManageStock
    Staff --- UC_ManageBundle
    Staff --- UC_StaffDashboard

    UC_CheckStock   -.->|"<<include>>"| UC_ManageStock
    UC_ReceiveProduct -.->|"<<include>>"| UC_ManageStock
    UC_AdjustStock  -.->|"<<include>>"| UC_ManageStock
    UC_ManageBundle -.->|"<<extend>>"| UC_ManageStock
    UC_ConfirmOrder -.->|"<<include>>"| UC_ViewOrders
    UC_PrepareOrder -.->|"<<include>>"| UC_CheckStock

    %% ── Admin Use Cases ──
    subgraph AdminUC["Admin"]
        direction TB
        UC_AdminDashboard(("Admin Dashboard"))
        UC_ManageProduct(("Manage Product"))
        UC_ManageCategory(("Manage Category"))
        UC_ManageBrand(("Manage Brand"))
        UC_ManageUser(("Manage User"))
        UC_SalesReport(("Sales Report"))
        UC_InventoryReport(("Inventory Report"))
        UC_FinancialReport(("Financial Report"))
        UC_UploadImage(("Upload Product Image"))
        UC_SetSkillLevel(("Set Skill Level / Tag"))
    end

    Admin --- UC_AdminDashboard
    Admin --- UC_ManageProduct
    Admin --- UC_ManageCategory
    Admin --- UC_ManageBrand
    Admin --- UC_ManageUser
    Admin --- UC_SalesReport
    Admin --- UC_InventoryReport
    Admin --- UC_FinancialReport

    UC_UploadImage  -.->|"<<include>>"| UC_ManageProduct
    UC_SetSkillLevel -.->|"<<include>>"| UC_ManageProduct
    UC_SalesReport  -.->|"<<include>>"| UC_AdminDashboard
    UC_InventoryReport -.->|"<<include>>"| UC_AdminDashboard
    UC_FinancialReport -.->|"<<include>>"| UC_AdminDashboard
```

---

## 🏗️ Class Diagram

```mermaid
classDiagram

    class User {
        +String userId
        +String email
        +String passwordHash
        +String firstName
        +String lastName
        +String phone
        +Role role
        +UserStatus status
        +DateTime createdAt
        +DateTime updatedAt
        +login(email: String, password: String) JWT
        +logout(userId: String) boolean
        +updateProfile(userId: String, data: Json) User
        +changePassword(oldPwd: String, newPwd: String) boolean
    }

    class Customer {
        +String customerId
        +DateTime dateOfBirth
        +Gender gender
        +DateTime createdAt
        +DateTime updatedAt
        +manageProfile(data: Json) Customer
        +manageAddress(data: Json) Address
        +viewOrderHistory(customerId: String) Order[]
        +trackOrder(orderId: String) OrderStatus
        +addReview(productId: String, rating: Int, comment: String) Review
        +compareProducts(productIds: String[]) Product[]
        +subscribeBackInStock(productId: String) Notification
        +viewNotifications(customerId: String) Notification[]
    }

    class Staff {
        +String staffId
        +String position
        +DateTime createdAt
        +DateTime updatedAt
        +viewOrders() Order[]
        +confirmOrder(orderId: String) Order
        +prepareOrder(orderId: String) Order
        +updateOrderStatus(orderId: String, status: OrderStatus) Order
        +receivingProduct(productId: String, qty: Int) InventoryLog
        +checkStock(productId: String) Inventory
        +adjustStock(productId: String, qty: Int, reason: String) InventoryLog
        +createBundleSet(bundleData: Json) Bundle
        +updateBundleSet(bundleId: String, data: Json) Bundle
        +viewDashboard() Json
    }

    class Admin {
        +String adminId
        +DateTime createdAt
        +DateTime updatedAt
        +manageUser(userId: String, action: String) User
        +viewDashboard() Json
        +createProduct(productData: Json) Product
        +updateProduct(productId: String, data: Json) Product
        +deleteProduct(productId: String) boolean
        +manageCategory(action: String, data: Json) Category
        +manageBrand(action: String, data: Json) Brand
        +generateSalesReport(dateRange: Json) DailySalesReport[]
        +generateInventoryReport() Json
        +generateFinancialReport(dateRange: Json) Json
        +manageSystem(config: Json) boolean
    }

    class Address {
        +String addressId
        +String customerId
        +String receiverName
        +String phone
        +String addressLine1
        +String addressLine2
        +String province
        +String city
        +String postalCode
        +Boolean isDefault
        +DateTime createdAt
        +DateTime updatedAt
        +setAsDefault(addressId: String) Address
        +validate(addressData: Json) boolean
    }

    class Cart {
        +String cartId
        +String customerId
        +String sessionId
        +DateTime createdAt
        +DateTime updatedAt
        +addItem(productId: String, qty: Int) CartItem
        +removeItem(cartItemId: String) boolean
        +updateItemQty(cartItemId: String, qty: Int) CartItem
        +clear(cartId: String) boolean
        +calculateTotal() Decimal
        +checkout(addressId: String) Order
        +mergeGuestCart(sessionId: String) Cart
    }

    class CartItem {
        +String cartItemId
        +String cartId
        +String productId
        +Int quantity
        +Decimal price
        +updateQuantity(qty: Int) CartItem
        +getSubtotal() Decimal
    }

    class Order {
        +String orderId
        +String customerId
        +String addressId
        +DateTime orderDate
        +Json shippingAddressSnapshot
        +Decimal totalAmount
        +Decimal shippingFee
        +Decimal discountAmount
        +Decimal grandTotal
        +OrderStatus status
        +String remark
        +createOrder(cart: Cart, addressId: String) Order
        +cancelOrder() Order
        +calculateTotal() Decimal
        +getStatus() OrderStatus
        +getOrderItems() OrderItem[]
    }

    class OrderItem {
        +String orderItemId
        +String orderId
        +String productId
        +Int quantity
        +Decimal unitPrice
        +Decimal totalPrice
        +getSubtotal() Decimal
    }

    class Review {
        +String reviewId
        +String customerId
        +String productId
        +Int rating
        +String comment
        +DateTime createdAt
        +create(customerId: String, productId: String, rating: Int, comment: String) Review
        +update(rating: Int, comment: String) Review
        +delete(reviewId: String) boolean
    }

    class Notification {
        +String notificationId
        +String customerId
        +String productId
        +String title
        +String message
        +NotificationType type
        +NotificationStatus status
        +Boolean isRead
        +DateTime createdAt
        +send(notificationId: String) boolean
        +markAsRead(notificationId: String) Notification
        +markAllAsRead(customerId: String) Int
    }

    class Payment {
        +String paymentId
        +String orderId
        +PaymentMethod paymentMethod
        +String provider
        +Decimal amount
        +PaymentStatus status
        +String transactionRef
        +DateTime paidAt
        +DateTime createdAt
        +processPayment(method: PaymentMethod, token: String) Payment
        +refund(paymentId: String) Payment
        +getStatus() PaymentStatus
        +verifyWebhook(payload: Json) boolean
    }

    class Shipment {
        +String shipmentId
        +String orderId
        +String trackingNumber
        +String carrier
        +ShippingStatus shippingStatus
        +DateTime shippingDate
        +DateTime deliveredDate
        +updateStatus(status: ShippingStatus) Shipment
        +generateTrackingNumber() String
        +getTrackingInfo() Json
    }

    class Product {
        +String productId
        +String name
        +String slug
        +String description
        +Decimal price
        +String sku
        +ProductStatus status
        +SkillLevel skillLevel
        +String brandId
        +String categoryId
        +DateTime createdAt
        +DateTime updatedAt
        +generateSlug(name: String) String
        +getImages() ProductImage[]
        +getInventory() Inventory
        +getBundles() Bundle[]
        +getReviews() Review[]
        +getAverageRating() Decimal
        +getBeginnerRecommendations() Product[]
        +getCompatibleProducts() Product[]
        +updateStock(quantity: Int, action: InventoryAction) InventoryLog
    }

    class Category {
        +String categoryId
        +String name
        +String description
        +getProducts() Product[]
        +getProductCount() Int
    }

    class Brand {
        +String brandId
        +String name
        +String description
        +getProducts() Product[]
    }

    class Inventory {
        +String inventoryId
        +String productId
        +Int quantity
        +Int reservedQuantity
        +DateTime updatedAt
        +checkAvailable(qty: Int) boolean
        +getAvailableQty() Int
        +reserve(qty: Int) Inventory
        +release(qty: Int) Inventory
        +deduct(qty: Int) Inventory
        +isOutOfStock() boolean
    }

    class InventoryLog {
        +String id
        +String productId
        +Int beforeQty
        +Int afterQty
        +Int changeQty
        +InventoryAction action
        +String staffId
        +DateTime createdAt
        +create(productId: String, before: Int, after: Int, action: InventoryAction, staffId: String) InventoryLog
        +getHistory(productId: String) InventoryLog[]
    }

    class ProductImage {
        +String imageId
        +String productId
        +String imageUrl
        +Boolean isPrimary
        +Int sortOrder
        +DateTime createdAt
        +upload(file: String) ProductImage
        +delete(imageId: String) boolean
        +reorder(sortOrder: Int) ProductImage
        +setPrimary(imageId: String) ProductImage
    }

    class Bundle {
        +String bundleId
        +String name
        +String description
        +DiscountType discountType
        +Decimal discountValue
        +DateTime createdAt
        +DateTime updatedAt
        +calculateDiscount(originalPrice: Decimal) Decimal
        +getBundlePrice() Decimal
        +getItems() BundleItem[]
        +checkAllInStock() boolean
        +isAvailable() boolean
    }

    class BundleItem {
        +String bundleItemId
        +String bundleId
        +String productId
        +Int quantity
        +validate() boolean
        +checkStock() boolean
    }

    class DailySalesReport {
        +String id
        +DateTime reportDate
        +Int totalOrders
        +Decimal totalRevenue
        +DateTime updatedAt
        +generateDaily(date: DateTime) DailySalesReport
        +getReportByDateRange(startDate: DateTime, endDate: DateTime) DailySalesReport[]
        +calculateTotalRevenue() Decimal
    }

    class SystemAuditLog {
        +String logId
        +String eventType
        +String referenceId
        +Json payload
        +DateTime createdAt
        +logEvent(type: String, refId: String, data: Json) SystemAuditLog
        +getLogsByType(type: String, limit: Int) SystemAuditLog[]
    }

    %% ── Inheritance ──
    User <|-- Customer
    User <|-- Staff
    User <|-- Admin

    %% ── Customer relations ──
    Customer "1"    --> "0..*" Address
    Customer "1"    --> "0..1" Cart
    Customer "1"    --> "0..*" Order
    Customer "1"    --> "0..*" Review
    Customer "1"    --> "0..*" Notification

    %% ── Cart relations ──
    Cart     "1"    --> "0..*" CartItem
    CartItem "0..*" --> "1"    Product

    %% ── Order relations ──
    Order    "1"    --> "1..*" OrderItem
    Order    "1"    --> "0..*" Payment
    Order    "1"    --> "0..1" Shipment
    Order    "0..*" --> "1"    Address
    OrderItem "0..*" --> "1"   Product

    %% ── Review relation ──
    Review "0..*" --> "1" Product

    %% ── Notification relation ──
    Notification "0..*" --> "0..1" Product

    %% ── Product relations ──
    Product "0..*" --> "1"    Category
    Product "0..*" --> "1"    Brand
    Product "1"    --> "1"    Inventory
    Product "1"    --> "0..*" ProductImage
    Product "1"    --> "0..*" InventoryLog

    %% ── InventoryLog ──
    InventoryLog "0..*" --> "0..1" Staff

    %% ── Bundle relations ──
    Bundle     "1"    --> "1..*" BundleItem
    BundleItem "0..*" --> "1"    Product
```

---

## 🔁 Sequence Diagrams

### 1. Customer

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant GW as API Gateway
    participant US as user-svc
    participant PS as product-svc
    participant CS as cart-svc
    participant CartDB as Cart DB (Postgres)
    participant OS as order-svc
    participant InvS as inventory-svc
    participant Pay as payment-svc
    participant Omise as Omise
    participant Notif as notification-svc
    participant Resend as Resend

    %% Register / Login (local credentials)
    C->>GW: POST /auth/register  หรือ  POST /auth/verify
    GW->>US: createUser / verifyCredentials
    US-->>GW: User record + JWT
    GW-->>C: Login สำเร็จ

    %% Browse & Filter Products
    C->>GW: GET /products?search=&category=&brand=&skillLevel=
    GW->>PS: getAllProducts(filters)
    PS-->>GW: Product list (พร้อม skillLevel, images, bundle info)
    GW-->>C: แสดงรายการสินค้า

    %% View Product Detail (includes accessories / compare)
    C->>GW: GET /products/:slug
    GW->>PS: getProductBySlug(slug)
    PS-->>GW: Product detail + accessories + reviews
    GW-->>C: แสดงหน้ารายละเอียดสินค้า

    %% Add to Cart
    C->>GW: POST /carts/:cartId/items  {productId, quantity, price}
    GW->>CS: addItem(cartId, productId, qty, price)
    CS->>CartDB: INSERT / UPDATE cart_items
    CartDB-->>CS: OK
    CS-->>GW: Cart updated
    GW-->>C: ตะกร้าอัปเดตแล้ว

    %% Checkout → Create Order
    C->>GW: POST /orders  {cartId, addressId}
    GW->>OS: createOrder(cart, addressId)
    OS->>GW: GET /inventory/stock-check  {items[]}
    GW->>InvS: checkStock(productIds)
    InvS-->>GW: stock available
    GW-->>OS: stock OK
    OS->>GW: POST /inventory/reserve  {items[]}
    GW->>InvS: reserveStock(items)
    InvS-->>GW: reserved
    OS-->>GW: Order created (status=pending)
    GW-->>C: สรุปคำสั่งซื้อ + orderId

    %% Payment (Omise Sandbox)
    C->>GW: POST /payments  {orderId, paymentMethod, token}
    GW->>Pay: processPayment(orderId, amount, token)
    Pay->>Omise: charge(amount, token)
    Omise-->>Pay: charge result
    alt charge สำเร็จ
        Pay->>GW: PUT /orders/:orderId  {status: confirmed}
        GW->>OS: updateStatus(confirmed)
        Pay->>GW: POST /inventory/sale-deduct  {items[]}
        GW->>InvS: saleDeductStock(items)
        Pay-->>GW: Payment success
        GW-->>C: ยืนยันการชำระเงิน
        Pay->>Notif: sendOrderConfirmEmail(customerId, orderId)
        Notif->>Resend: sendEmail()
    else charge ล้มเหลว
        Pay->>GW: POST /inventory/release  {items[]}
        GW->>InvS: releaseStock(items)
        Pay-->>GW: Payment failed
        GW-->>C: แจ้งการชำระเงินไม่สำเร็จ
    end

    %% Track Order
    C->>GW: GET /orders/:orderId
    GW->>OS: getOrder(orderId)
    OS-->>GW: Order + Shipment status
    GW-->>C: แสดงสถานะ Tracking

    %% Write Review
    C->>GW: POST /products/:productId/reviews  {rating, comment}
    GW->>PS: createReview(customerId, productId, rating, comment)
    PS-->>GW: Review saved
    GW-->>C: รีวิวถูกบันทึกแล้ว
```

### 2. Staff

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff
    participant GW as API Gateway
    participant OS as order-svc
    participant InvS as inventory-svc
    participant PS as product-svc
    participant Notif as notification-svc
    participant Rep as report-svc

    %% Login
    S->>GW: POST /auth/verify  {email, password}
    GW->>GW: user-svc verifyCredentials → JWT
    GW-->>S: Login สำเร็จ (role=staff)

    %% View Orders
    S->>GW: GET /orders  (+ filter status)
    GW->>OS: getAllOrders(filters)
    OS-->>GW: Order list
    GW-->>S: แสดงรายการคำสั่งซื้อ

    %% Confirm Order
    S->>GW: PUT /orders/:orderId  {status: confirmed}
    GW->>OS: updateOrderStatus(orderId, confirmed)
    OS-->>GW: Order confirmed
    GW-->>S: สถานะอัปเดต

    %% Prepare & Pack → reserve stock
    S->>GW: PUT /orders/:orderId  {status: packed}
    GW->>OS: updateOrderStatus(orderId, packed)
    OS->>GW: POST /inventory/reserve  {items[]}
    GW->>InvS: reserveStock(items)
    InvS-->>GW: Stock reserved (reservedQuantity เพิ่ม)
    OS-->>GW: Packed
    GW-->>S: สถานะ: Packed

    %% Ship → notify customer
    S->>GW: PUT /orders/:orderId  {status: shipped, trackingNumber}
    GW->>OS: updateOrderStatus + createShipment
    OS->>Notif: notifyCustomer(customerId, orderId, shipped)
    Notif-->>OS: sent
    OS-->>GW: Shipped
    GW-->>S: ยืนยันแล้ว

    %% Receive Product (เติมสต็อก)
    S->>GW: POST /inventory/receive  {productId, expectedQty, receivedQty, staffId}
    GW->>InvS: receiveStock(productId, receivedQty, staffId)
    InvS->>InvS: updateInventory + createInventoryLog(action=receive)
    InvS-->>GW: Stock updated + InventoryLog created
    GW-->>S: สต็อกอัปเดตแล้ว

    %% Check Stock / Low Stock
    S->>GW: GET /inventory/stock
    GW->>InvS: getAllStock()
    InvS-->>GW: Inventory list (quantity, reservedQuantity, reorderPoint)
    GW-->>S: แสดงข้อมูลสต็อก + แจ้งเตือน Low / Critical

    %% Manage Bundle Set
    S->>GW: POST /products/bundles  {name, items[], discountType, discountValue}
    GW->>PS: createBundle(bundleData)
    PS-->>GW: Bundle created
    GW-->>S: บันทึกชุดสินค้าแล้ว

    S->>GW: PUT /products/bundles/:bundleId  {updatedData}
    GW->>PS: updateBundle(bundleId, data)
    PS-->>GW: Bundle updated
    GW-->>S: แก้ไขชุดสินค้าแล้ว

    %% Staff Dashboard
    S->>GW: GET /reports/dashboard
    GW->>Rep: getDashboardSummary()
    Rep-->>GW: totalOrders, lowStockAlerts, pendingOrders
    GW-->>S: แสดง Dashboard
```

### 3. Admin

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant GW as API Gateway
    participant US as user-svc
    participant PS as product-svc
    participant InvS as inventory-svc
    participant Rep as report-svc
    participant R2 as Cloudflare R2

    %% Login
    A->>GW: POST /auth/verify  {email, password}
    GW->>US: verifyCredentials → JWT (role=admin)
    GW-->>A: Login สำเร็จ

    %% Admin Dashboard
    A->>GW: GET /reports/dashboard
    GW->>Rep: getDashboardSummary()
    Rep-->>GW: totalOrders, totalRevenue, topProducts
    GW-->>A: แสดง Dashboard สรุปภาพรวม

    %% Manage Product — Create
    A->>GW: POST /products  {productData + imageFile}
    GW->>PS: createProduct(data)
    PS->>R2: uploadImage(file)
    R2-->>PS: imageUrl
    PS-->>GW: Product created
    GW-->>A: บันทึกสินค้าแล้ว

    %% Manage Product — Edit (รวม skillLevel)
    A->>GW: PUT /products/:productId  {price, skillLevel, ...}
    GW->>PS: updateProduct(productId, data)
    PS-->>GW: Product updated
    GW-->>A: อัปเดตแล้ว

    %% Manage Category / Brand
    A->>GW: POST /products/categories  {name}
    GW->>PS: createCategory(data)
    PS-->>GW: Category created
    GW-->>A: บันทึกหมวดหมู่แล้ว

    %% Manage Users
    A->>GW: GET /users
    GW->>US: getAllUsers()
    US-->>GW: User list (all roles)
    GW-->>A: แสดงรายชื่อผู้ใช้

    A->>GW: PUT /users/:userId  {status: banned}
    GW->>US: updateUserStatus(userId, banned)
    US-->>GW: Updated
    GW-->>A: ยืนยันแล้ว

    %% Sales Report
    A->>GW: GET /reports/sales?start=&end=
    GW->>Rep: getSalesReport(dateRange)
    Rep-->>GW: DailySalesReport + ProductSalesSnapshot
    GW-->>A: แสดงรายงานยอดขาย

    %% Inventory Report
    A->>GW: GET /reports/inventory
    GW->>Rep: getInventoryReport()
    Rep-->>GW: InventorySnapshot (stockLevel, status)
    GW-->>A: แสดงรายงานสต็อก

    %% Financial Report
    A->>GW: GET /reports/financial
    GW->>Rep: getFinancialReport()
    Rep-->>GW: Revenue summary (จาก DailySalesReport)
    GW-->>A: แสดงรายงานการเงิน
```

---

## 🖥️ System Architecture

```mermaid
flowchart TB

    subgraph ClientLayer["Client Layer"]
        WebApp["💻 Customer Web App\n(Next.js — apps/web)"]
        StaffPortal["🔧 Staff Portal\n(Next.js — apps/staff)"]
        AdminPortal["📋 Admin Portal\n(Next.js — apps/admin)"]
    end

    subgraph GatewayLayer["API Gateway (Hono · Cloudflare Workers)"]
        APIGW(("🌐 API Gateway"))
    end

    subgraph Microservices["Microservice Layer (Hono · Cloudflare Workers + Prisma)"]
        AuthSvc["🔑 auth-svc\n/auth/*"]
        UserSvc["👤 user-svc\n/users/*"]
        ProductSvc["📦 product-svc\n/products/*"]
        InventorySvc["🧮 inventory-svc\n/inventory/*"]
        OrderSvc["📋 order-svc\n/orders/*"]
        CartSvc["🛒 cart-svc\n/carts/*"]
        PaymentSvc["💳 payment-svc\n/payments/*"]
        NotifSvc["🔔 notification-svc\n/notifications/*"]
        ReportSvc["📊 report-svc\n/reports/*"]
    end

    subgraph DataLayer["Data Layer (Neon Postgres — แยก DB ต่อ Service)"]
        UserDB[("user_db\nUser · Customer\nStaff · Admin · Address")]
        ProductDB[("product_db\nProduct · Brand · Category\nProductImage · Bundle\nBundleItem · Review")]
        InventoryDB[("inventory_db\nInventory · InventoryLog")]
        OrderDB[("order_db\nOrder · OrderItem · Shipment")]
        CartDB[("cart_db\nCart · CartItem")]
        PaymentDB[("payment_db\nPayment")]
        NotifDB[("notification_db\nNotification")]
        ReportDB[("report_db\nDailySalesReport\nInventorySnapshot\nProductSalesSnapshot\nSystemAuditLog")]
    end

    subgraph ExternalServices["External Services"]
        Kinde["🔑 Kinde OAuth"]
        Omise["💳 Omise\n(Payment Sandbox)"]
        Resend["✉️ Resend\n(Email — Reset Password)"]
        R2["🗂️ Cloudflare R2\n(Image Storage)"]
    end

    %% Client → Gateway
    WebApp --> APIGW
    StaffPortal --> APIGW
    AdminPortal --> APIGW

    %% Gateway → Services
    APIGW --> AuthSvc
    APIGW --> UserSvc
    APIGW --> ProductSvc
    APIGW --> InventorySvc
    APIGW --> OrderSvc
    APIGW --> CartSvc
    APIGW --> PaymentSvc
    APIGW --> NotifSvc
    APIGW --> ReportSvc

    %% Cross-service calls (routed back through Gateway)
    OrderSvc -. "reserve / release / sale_deduct stock" .-> APIGW
    PaymentSvc -. "update order status after payment" .-> APIGW
    NotifSvc -. "send email (forgot-password)" .-> APIGW

    %% External integrations
    AuthSvc -. "OAuth login" .-> Kinde
    Kinde -- "webhook (sync user)" --> UserSvc
    PaymentSvc -. "charge / refund" .-> Omise
    Omise -- "webhook (payment result)" --> PaymentSvc
    UserSvc -. "send reset-password email" .-> Resend
    ProductSvc -. "upload product image" .-> R2

    %% Service → DB
    UserSvc --> UserDB
    ProductSvc --> ProductDB
    InventorySvc --> InventoryDB
    OrderSvc --> OrderDB
    CartSvc --> CartDB
    PaymentSvc --> PaymentDB
    NotifSvc --> NotifDB
    ReportSvc --> ReportDB
```

---

## 🎯 Wireframe / Prototype - Clik to inspect
[![Design System](https://raw.githubusercontent.com/csi204/musicgear/main/images/Prototype.png)](https://www.figma.com/design/RSQ1FfYVF5qJZzgem9ntBt/Untitled?node-id=0-1&t=H5nnEYQtm8Cw6YVe-1)

# Data Schema (JSON)

> **หมายเหตุ:** แต่ละ microservice มีฐานข้อมูล PostgreSQL (Neon) แยกกันคนละ DB ตามหลัก Database-per-Service โดย soft reference (ไม่มี FK ข้าม service)

```json
{
  "[user_db] users": {
    "description": "ตารางหลักของผู้ใช้ทุก role — Single base table + extension table (table-per-subtype). userId ใช้ UUID ปกติ (อาจเป็น Kinde sub สำหรับ OAuth login)",
    "fields": {
      "userId":       { "type": "string", "primaryKey": true, "default": "uuid()", "note": "Kinde sub หรือ UUID" },
      "email":        { "type": "string", "unique": true, "required": true },
      "passwordHash": { "type": "string", "required": true },
      "firstName":    { "type": "string", "required": true },
      "lastName":     { "type": "string", "required": true },
      "phone":        { "type": "string", "required": false },
      "role":         { "type": "enum", "values": ["customer", "staff", "admin"], "required": true },
      "status":       { "type": "enum", "values": ["active", "inactive", "banned"], "default": "active" },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[user_db] customers": {
    "description": "Extension table ของ users เฉพาะ role=customer",
    "fields": {
      "customerId":   { "type": "string", "primaryKey": true, "references": "users.userId", "onDelete": "Cascade" },
      "dateOfBirth":  { "type": "date", "required": false },
      "gender":       { "type": "enum", "values": ["male", "female", "other", "prefer_not_to_say"], "required": false },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[user_db] staff": {
    "description": "Extension table ของ users เฉพาะ role=staff",
    "fields": {
      "staffId":      { "type": "string", "primaryKey": true, "references": "users.userId", "onDelete": "Cascade" },
      "position":     { "type": "string", "required": true, "example": "Warehouse / Packing" },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[user_db] admins": {
    "description": "Extension table ของ users เฉพาะ role=admin",
    "fields": {
      "adminId":      { "type": "string", "primaryKey": true, "references": "users.userId", "onDelete": "Cascade" },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[user_db] addresses": {
    "fields": {
      "addressId":    { "type": "UUID", "primaryKey": true },
      "customerId":   { "type": "string", "references": "customers.customerId", "onDelete": "Cascade", "required": true },
      "receiverName": { "type": "string", "required": true },
      "phone":        { "type": "string", "required": true },
      "addressLine1": { "type": "string", "required": true },
      "addressLine2": { "type": "string", "required": false },
      "province":     { "type": "string", "required": true },
      "city":         { "type": "string", "required": true },
      "postalCode":   { "type": "string", "required": true },
      "isDefault":    { "type": "boolean", "default": false },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[product_db] brands": {
    "fields": {
      "brandId":      { "type": "UUID", "primaryKey": true },
      "name":         { "type": "string", "unique": true, "required": true },
      "description":  { "type": "text", "required": false }
    }
  },

  "[product_db] categories": {
    "fields": {
      "categoryId":   { "type": "UUID", "primaryKey": true },
      "name":         { "type": "string", "unique": true, "required": true },
      "description":  { "type": "text", "required": false }
    }
  },

  "[product_db] products": {
    "fields": {
      "productId":    { "type": "UUID", "primaryKey": true },
      "name":         { "type": "string", "required": true },
      "slug":         { "type": "string", "unique": true, "required": true, "note": "generate จาก name เช่น 'Yamaha F310' → 'yamaha-f310' ใช้เป็น URL /products/:slug" },
      "description":  { "type": "text", "required": false },
      "price":        { "type": "decimal(10,2)", "required": true, "min": 0 },
      "sku":          { "type": "string", "unique": true, "required": true },
      "status":       { "type": "enum", "values": ["active", "inactive", "discontinued", "out_of_stock"], "default": "active" },
      "skillLevel":   { "type": "enum", "values": ["beginner", "intermediate", "advanced"], "required": false, "note": "ใช้สำหรับ Beginner Recommendation (Req 10)" },
      "brandId":      { "type": "UUID", "references": "brands.brandId", "required": true },
      "categoryId":   { "type": "UUID", "references": "categories.categoryId", "required": true },
      "createdAt":    { "type": "datetime", "default": "now()" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[product_db] product_images": {
    "fields": {
      "imageId":      { "type": "UUID", "primaryKey": true },
      "productId":    { "type": "UUID", "references": "products.productId", "required": true },
      "imageUrl":     { "type": "string", "required": true, "note": "URL ไปยัง Cloudflare R2" },
      "isPrimary":    { "type": "boolean", "default": false },
      "sortOrder":    { "type": "integer", "default": 0, "note": "0 = รูปปก, เรียงน้อย→มาก" },
      "createdAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[product_db] bundles": {
    "description": "เซ็ตสินค้า Bundle Set ที่ Staff สร้างเพื่อจำหน่ายเป็นชุด (Req 11)",
    "fields": {
      "bundleId":      { "type": "UUID", "primaryKey": true },
      "name":          { "type": "string", "required": true },
      "description":   { "type": "text", "required": false },
      "discountType":  { "type": "enum", "values": ["percentage", "fixed_amount"], "required": true },
      "discountValue": { "type": "decimal(10,2)", "required": true, "min": 0 },
      "createdAt":     { "type": "datetime", "default": "now()" },
      "updatedAt":     { "type": "datetime", "default": "now()" }
    }
  },

  "[product_db] bundle_items": {
    "fields": {
      "bundleItemId": { "type": "UUID", "primaryKey": true },
      "bundleId":     { "type": "UUID", "references": "bundles.bundleId", "required": true },
      "productId":    { "type": "UUID", "references": "products.productId", "required": true },
      "quantity":     { "type": "integer", "required": true, "min": 1 }
    }
  },

  "[product_db] reviews": {
    "fields": {
      "reviewId":   { "type": "UUID", "primaryKey": true },
      "customerId": { "type": "UUID", "required": true, "note": "Soft ref → user-svc" },
      "productId":  { "type": "UUID", "references": "products.productId", "required": true },
      "rating":     { "type": "integer", "min": 1, "max": 5, "required": true },
      "comment":    { "type": "text", "required": false },
      "createdAt":  { "type": "datetime", "default": "now()" }
    }
  },

  "[inventory_db] inventory": {
    "fields": {
      "inventoryId":      { "type": "UUID", "primaryKey": true },
      "productId":        { "type": "UUID", "unique": true, "required": true, "note": "Soft ref → product-svc" },
      "quantity":         { "type": "integer", "default": 0, "min": 0 },
      "reservedQuantity": { "type": "integer", "default": 0, "min": 0, "note": "จองตอน checkout ก่อน payment confirm" },
      "reorderPoint":     { "type": "integer", "default": 0, "note": "จุด threshold สำหรับ Low/Critical Stock Alert ใน Staff Dashboard" },
      "updatedAt":        { "type": "datetime (timestamptz)", "default": "now()" }
    }
  },

  "[inventory_db] inventory_logs": {
    "description": "เก็บประวัติทุกครั้งที่สต็อกถูกแก้ไข (รับของ/จอง/คืน/ตัดขาย)",
    "fields": {
      "id":        { "type": "UUID", "primaryKey": true },
      "productId": { "type": "UUID", "required": true, "note": "Soft ref → product-svc" },
      "orderId":   { "type": "UUID", "required": false, "note": "Soft ref → order-svc (ใช้ตอน reserve/release/sale_deduct)" },
      "beforeQty": { "type": "integer", "required": true },
      "afterQty":  { "type": "integer", "required": true },
      "changeQty": { "type": "integer", "required": true, "note": "afterQty - beforeQty" },
      "action":    { "type": "enum", "values": ["receive", "adjust", "reserve", "release", "sale_deduct"],
                     "note": "receive=รับของเข้า, adjust=แก้มือ, reserve=จอง, release=คืนตอน payment fail, sale_deduct=ตัดขายสำเร็จ" },
      "staffId":   { "type": "UUID", "required": false, "note": "Soft ref → user-svc / null ถ้า action จากระบบอัตโนมัติ" },
      "createdAt": { "type": "datetime (timestamptz)", "default": "now()" },
      "__indexes": ["productId", "orderId", "staffId", "createdAt"]
    }
  },

  "[cart_db] carts": {
    "description": "Cart เก็บใน PostgreSQL (Neon) ไม่ใช่ Redis — รองรับทั้ง logged-in user และ guest",
    "fields": {
      "cartId":     { "type": "UUID", "primaryKey": true },
      "customerId": { "type": "UUID", "required": false, "note": "Soft ref → user-svc / null = guest cart" },
      "sessionId":  { "type": "string", "required": false, "note": "ใช้กรณี guest ที่ยังไม่ login" },
      "createdAt":  { "type": "datetime", "default": "now()" },
      "updatedAt":  { "type": "datetime", "default": "now()" }
    }
  },

  "[cart_db] cart_items": {
    "fields": {
      "cartItemId": { "type": "UUID", "primaryKey": true },
      "cartId":     { "type": "UUID", "references": "carts.cartId", "required": true },
      "productId":  { "type": "UUID", "required": true, "note": "Soft ref → product-svc" },
      "quantity":   { "type": "integer", "required": true, "min": 1 },
      "price":      { "type": "decimal(10,2)", "required": true, "note": "snapshot ราคา ณ ตอนเพิ่มลงตะกร้า" }
    }
  },

  "[order_db] orders": {
    "fields": {
      "orderId":                 { "type": "UUID", "primaryKey": true },
      "customerId":              { "type": "UUID", "required": true, "note": "Soft ref → user-svc" },
      "addressId":               { "type": "UUID", "required": true, "note": "Soft ref → user-svc address" },
      "orderDate":               { "type": "datetime", "default": "now()" },
      "shippingAddressSnapshot": { "type": "json", "required": true, "note": "freeze ที่อยู่ ณ วันสั่งซื้อ" },
      "totalAmount":             { "type": "decimal(10,2)", "required": true },
      "shippingFee":             { "type": "decimal(10,2)", "default": 0 },
      "discountAmount":          { "type": "decimal(10,2)", "default": 0 },
      "grandTotal":              { "type": "decimal(10,2)", "required": true },
      "status":                  { "type": "enum", "values": ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"], "default": "pending" },
      "remark":                  { "type": "text", "required": false }
    }
  },

  "[order_db] order_items": {
    "fields": {
      "orderItemId": { "type": "UUID", "primaryKey": true },
      "orderId":     { "type": "UUID", "references": "orders.orderId", "required": true },
      "productId":   { "type": "UUID", "required": true, "note": "Soft ref → product-svc" },
      "quantity":    { "type": "integer", "required": true, "min": 1 },
      "unitPrice":   { "type": "decimal(10,2)", "required": true, "note": "snapshot ราคา ณ วันสั่งซื้อ" },
      "totalPrice":  { "type": "decimal(10,2)", "required": true }
    }
  },

  "[order_db] shipments": {
    "fields": {
      "shipmentId":     { "type": "UUID", "primaryKey": true },
      "orderId":        { "type": "UUID", "references": "orders.orderId", "unique": true, "required": true },
      "trackingNumber": { "type": "string", "required": false },
      "carrier":        { "type": "string", "required": false },
      "shippingStatus": { "type": "enum", "values": ["preparing", "shipped", "in_transit", "delivered", "returned"], "default": "preparing" },
      "shippingDate":   { "type": "datetime", "required": false },
      "deliveredDate":  { "type": "datetime", "required": false }
    }
  },

  "[payment_db] payments": {
    "fields": {
      "paymentId":      { "type": "UUID", "primaryKey": true },
      "orderId":        { "type": "UUID", "required": true, "note": "Soft ref → order-svc" },
      "paymentMethod":  { "type": "enum", "values": ["credit_card", "promptpay", "bank_transfer"], "required": true },
      "provider":       { "type": "string", "default": "omise" },
      "amount":         { "type": "decimal(10,2)", "required": true },
      "status":         { "type": "enum", "values": ["pending", "paid", "failed", "refunded"], "default": "pending" },
      "transactionRef": { "type": "string", "required": false },
      "paidAt":         { "type": "datetime", "required": false },
      "createdAt":      { "type": "datetime", "default": "now()" }
    }
  },

  "[notification_db] notifications": {
    "fields": {
      "notificationId": { "type": "UUID", "primaryKey": true },
      "customerId":     { "type": "UUID", "required": true, "note": "Soft ref → user-svc" },
      "orderId":        { "type": "UUID", "required": false, "note": "Soft ref → order-svc" },
      "productId":      { "type": "UUID", "required": false, "note": "Soft ref → product-svc (ใช้กรณี back_in_stock/promotion)" },
      "title":          { "type": "string", "required": true },
      "message":        { "type": "text", "required": true },
      "type":           { "type": "enum", "values": ["order_update", "back_in_stock", "promotion", "system"], "required": true },
      "status":         { "type": "enum", "values": ["sent", "pending", "failed"], "default": "pending" },
      "isRead":         { "type": "boolean", "default": false },
      "isStaffAlert":   { "type": "boolean", "default": false, "note": "true = แสดงใน Staff Portal (Low Stock Alert, Order ใหม่)" },
      "createdAt":      { "type": "datetime", "default": "now()" },
      "__indexes":      ["orderId", "[isStaffAlert, isRead]"]
    }
  },

  "[report_db] daily_sales_reports": {
    "description": "ข้อมูลยอดขายรวมรายวัน สร้าง/อัปเดตโดย report-svc เมื่อมี order เข้ามา",
    "fields": {
      "id":           { "type": "UUID", "primaryKey": true },
      "reportDate":   { "type": "date", "unique": true },
      "totalOrders":  { "type": "integer", "default": 0 },
      "totalRevenue": { "type": "decimal(10,2)", "default": 0 },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[report_db] product_sales_snapshots": {
    "description": "ข้อมูลยอดขายแยกรายสินค้าต่อวัน ใช้สร้าง Top Products report ใน Admin Dashboard",
    "fields": {
      "id":           { "type": "UUID", "primaryKey": true },
      "reportDate":   { "type": "date", "required": true },
      "productId":    { "type": "UUID", "required": true, "note": "Soft ref → product-svc" },
      "productName":  { "type": "string", "required": true },
      "category":     { "type": "string", "required": true },
      "quantitySold": { "type": "integer", "default": 0 },
      "revenue":      { "type": "decimal(10,2)", "default": 0 },
      "updatedAt":    { "type": "datetime", "default": "now()" },
      "__unique":     "[reportDate, productId]"
    }
  },

  "[report_db] inventory_snapshots": {
    "description": "Snapshot สต็อกสินค้าสำหรับ Inventory Report ใน Admin — อัปเดตเมื่อ inventory เปลี่ยน",
    "fields": {
      "id":           { "type": "UUID", "primaryKey": true },
      "productId":    { "type": "UUID", "unique": true, "required": true, "note": "Soft ref → product-svc" },
      "productName":  { "type": "string", "required": true },
      "category":     { "type": "string", "default": "Uncategorized" },
      "stockLevel":   { "type": "integer", "default": 0 },
      "reorderPoint": { "type": "integer", "default": 0 },
      "status":       { "type": "string", "note": "'In Stock' | 'Low' | 'Critical'" },
      "updatedAt":    { "type": "datetime", "default": "now()" }
    }
  },

  "[report_db] system_audit_logs": {
    "description": "บันทึก event ทุกประเภทที่เกิดในระบบ ใช้สำหรับ audit trail และ debug",
    "fields": {
      "logId":       { "type": "UUID", "primaryKey": true },
      "eventType":   { "type": "string", "required": true, "example": "order_created, inventory_adjusted" },
      "referenceId": { "type": "UUID", "required": true, "note": "ID ของ Order หรือ Product ที่เกี่ยวข้อง" },
      "payload":     { "type": "json", "required": true },
      "createdAt":   { "type": "datetime", "default": "now()" }
    }
  }
}
```

# User Acceptance Testing: UAT (Manual Testing)
แบ่งผู้ทดสอบตาม role ที่รับผิดชอบ:

| ผู้ทดสอบ | Role ที่ทดสอบ |
|---|---|
| เดียร์ (67095474) | Staff |
| บุญ (67096366) | Customer |
| เขต (67118456) | Admin |

> หมายเหตุ: คอลัมน์ **Actual Result** และ **Status** เว้นว่างไว้ให้กรอกตอนทดสอบจริงกับระบบที่ deploy เสร็จแล้ว

## 🧑‍🎤 UAT — Customer (ผู้ทดสอบ: บุญ)

| TC ID | Feature | ขั้นตอนการทดสอบ | Test Data | ผลลัพธ์ที่คาดหวัง | ผลลัพธ์จริง | Status |
|---|---|---|---|---|---|---|
| CUS-01 | Register | กรอกอีเมล/รหัสผ่าน/ชื่อ-นามสกุล แล้วกด Register | email: boon@test.com, password: Test1234! | สมัครสำเร็จ, redirect ไปหน้า login หรือ login อัตโนมัติ | | |
| CUS-02 | Login | กรอก email/password ที่ถูกต้อง แล้วกด Login | account ที่สมัครไว้ | login สำเร็จ, ได้รับ JWT, เข้าหน้า homepage | | |
| CUS-03 | Login (negative) | กรอก password ผิด | wrong password | ระบบแจ้ง error ไม่ login ผ่าน | | |
| CUS-04 | Forgot Password | กรอก email ที่ลงทะเบียนไว้ กด Reset Password | email ที่ใช้สมัคร | ได้รับอีเมล reset-password จาก Resend | | |
| CUS-05 | Browse & Search Product | พิมพ์คำค้นหาในช่อง search เช่น "guitar" | keyword: guitar | แสดงรายการสินค้าที่ตรงกับคำค้นหา | | |
| CUS-06 | Filter Product | เลือก filter brand / category | brand: Yamaha | แสดงเฉพาะสินค้าที่ตรง filter | | |
| CUS-07 | View Product Detail | คลิกเข้าไปดูสินค้า 1 ชิ้น | product: กีตาร์ | แสดงรายละเอียดสินค้าครบ (ราคา, สเปก, skillLevel, รูป, รีวิว, อุปกรณ์แนะนำ) | | |
| CUS-08 | Compare Product | เลือกสินค้า 2 ชิ้นขึ้นไปเพื่อเปรียบเทียบ | สินค้า 2 รายการ | แสดงตารางเปรียบเทียบ spec/ราคา ข้างกัน | | |
| CUS-09 | Bundle / Accessories Recommendation | เปิดหน้าสินค้า ดูส่วน Accessories แนะนำ | สินค้าที่มี bundle | แสดงรายการอุปกรณ์ที่แนะนำให้ใช้ร่วมกัน สามารถติ๊กเพิ่มลงตะกร้าพร้อมกันได้ | | |
| CUS-10 | Add to Cart | กด "Add to cart" จากหน้ารายละเอียดสินค้า | qty: 1 | สินค้าถูกเพิ่มในตะกร้า, จำนวนในไอคอนตะกร้าอัปเดต | | |
| CUS-11 | Manage Cart | เพิ่ม/ลด/ลบสินค้าในตะกร้า | - | ยอดรวมในตะกร้าคำนวณใหม่ถูกต้องทุกครั้งที่แก้ไข | | |
| CUS-12 | Manage Address | เพิ่มที่อยู่จัดส่งใหม่ และตั้งเป็น default | ที่อยู่ใหม่ 1 รายการ | บันทึกที่อยู่สำเร็จ และแสดงเป็นค่า default ตอน checkout | | |
| CUS-13 | Checkout | กด checkout จากตะกร้า เลือกที่อยู่จัดส่ง | cart ที่มีของ ≥1 ชิ้น | สร้าง order สถานะ pending พร้อมสรุปยอด (subtotal/shipping/total) ถูกต้อง | | |
| CUS-14 | Payment — สำเร็จ (Omise sandbox) | เลือกวิธีชำระเงิน กรอกข้อมูลบัตร sandbox | Omise test card | ชำระเงินสำเร็จ, order status เปลี่ยนเป็น confirmed | | |
| CUS-15 | Payment — ล้มเหลว (negative) | ใช้บัตรที่ถูก decline โดย sandbox | Omise decline test card | แสดง error, order ไม่เปลี่ยนสถานะ, สต็อกที่ reserve ไว้ถูกคืน (releaseStock) | | |
| CUS-16 | Order Tracking | เข้าหน้า "My Orders" ดูสถานะ order ที่สั่งไว้ | order ที่ confirm แล้ว | แสดงสถานะปัจจุบันถูกต้อง (pending/packed/shipped/delivered) | | |
| CUS-17 | Order History | เข้าดูประวัติคำสั่งซื้อทั้งหมด | account ที่มี order เก่า | แสดงรายการ order ย้อนหลังครบถ้วน เรียงตามวันที่ | | |
| CUS-18 | Write Review | ให้คะแนนดาว + เขียนคอมเมนต์สินค้า | rating: 5, comment: "เสียงดีมาก" | รีวิวถูกบันทึกและแสดงในหน้าสินค้า | | |

## 🔧 UAT — Staff (ผู้ทดสอบ: เดียร์)

| TC ID | Feature | ขั้นตอนการทดสอบ | Test Data | ผลลัพธ์ที่คาดหวัง | ผลลัพธ์จริง | Status |
|---|---|---|---|---|---|---|
| STF-01 | Login | login ด้วย account role=staff | staff account | login สำเร็จ, เข้าสู่ Staff Portal (โทนมืด) | | |
| STF-02 | Access Control | ลอง login ด้วย staff account แล้วเข้า URL ของ Admin Portal ตรงๆ | staff JWT | ระบบ block / redirect กลับ, ไม่สามารถเข้าถึงหน้า Admin ได้ | | |
| STF-03 | View All Orders | เข้าหน้า order list | - | แสดงรายการคำสั่งซื้อทั้งหมด พร้อมสถานะปัจจุบัน | | |
| STF-04 | Confirm Order | เลือก order สถานะ pending แล้วกด Confirm | order ที่ status=pending | order status เปลี่ยนเป็น confirmed | | |
| STF-05 | Prepare / Pack (reserve stock) | เปิด order ที่ confirmed แล้ว กด "Prepare" | order ที่ confirmed | reservedQuantity เพิ่ม, status เปลี่ยนเป็น packed | | |
| STF-06 | Packing Slip / Bundle Awareness | เปิด order ที่มีสินค้าเป็นชุด bundle | order ที่มี bundle items | หน้าจัดเตรียมแสดงรายการสินค้าย่อยใน bundle ครบถ้วน | | |
| STF-07 | Update Status → Shipped | กรอก tracking number แล้วเปลี่ยนสถานะเป็น shipped | tracking no. ตัวอย่าง | status order/shipment เปลี่ยนเป็น shipped, notification ส่งถึงลูกค้า | | |
| STF-08 | Check Stock / Low Stock Alert | เข้าหน้า Inventory ดูสต็อกสินค้า | - | แสดง quantity, reservedQuantity, และแจ้ง Low/Critical ตาม reorderPoint | | |
| STF-09 | Receiving Product (รับของเข้าสต็อก) | กรอกจำนวนสินค้าที่รับเข้า กด Confirm | productId, expectedQty: 20, receivedQty: 18 | quantity เพิ่มตาม receivedQty, บันทึก InventoryLog (action=receive) | | |
| STF-10 | Receiving — Discrepancy Warning | รับของเข้าโดยที่ receivedQty ≠ expectedQty | receivedQty < expectedQty | ระบบแสดง confirm dialog แจ้งความไม่ตรง ก่อนยืนยัน | | |
| STF-11 | Manage Bundle — Create | สร้าง bundle set ใหม่ เลือกสินค้า + ตั้ง discount | 3 สินค้า + discount 10% | บันทึก bundle สำเร็จ, ปรากฏในรายการ | | |
| STF-12 | Manage Bundle — Edit | แก้ไข discount หรือรายการสินค้าใน bundle ที่มีอยู่ | bundle ที่สร้างไว้ | ข้อมูล bundle อัปเดตสำเร็จ | | |
| STF-13 | Manage Bundle — Delete | ลบ bundle ออกจากรายการ | bundle ที่สร้างไว้ | bundle ถูกลบ ไม่ปรากฏในรายการอีก | | |
| STF-14 | Staff Dashboard | เข้าหน้า Dashboard | - | แสดงสรุป: order รอจัดเตรียม, สต็อก Low/Critical, ยอด order วันนี้ | | |

## 📊 UAT — Admin (ผู้ทดสอบ: เขต)

| TC ID | Feature | ขั้นตอนการทดสอบ | Test Data | ผลลัพธ์ที่คาดหวัง | ผลลัพธ์จริง | Status |
|---|---|---|---|---|---|---|
| ADM-01 | Login | login ด้วย account role=admin | admin account | login สำเร็จ, เข้าสู่ Admin Portal | | |
| ADM-02 | Access Control | ลอง login ด้วย customer/staff account แล้วเข้า URL ของ Admin ตรงๆ | non-admin JWT | ระบบ block ไม่ให้เข้าถึง route admin ใดๆ | | |
| ADM-03 | View Dashboard | เข้าหน้า dashboard หลัก | - | แสดงสรุป totalOrders, totalRevenue, topProducts ภาพรวม | | |
| ADM-04 | Manage Category — Create | สร้างหมวดหมู่ใหม่ | name: "Guitar Accessories" | บันทึกสำเร็จ, เลือกใช้ตอนสร้างสินค้าได้ | | |
| ADM-05 | Manage Category — Edit/Delete | แก้ไขชื่อ / ลบ category ที่ไม่มีสินค้าผูก | category ทดสอบ | แก้ไข/ลบสำเร็จ | | |
| ADM-06 | Manage Category — Delete (negative) | ลบ category ที่ยังมีสินค้าผูกอยู่ | category ที่มี product | ระบบ block การลบ พร้อมแจ้งเตือน | | |
| ADM-07 | Manage Product — Create | เพิ่มสินค้าใหม่ พร้อมอัปโหลดรูปภาพ | productData + รูป 1 ไฟล์ | สินค้าถูกสร้าง, รูปอัปโหลดขึ้น Cloudflare R2 สำเร็จ | | |
| ADM-08 | Manage Product — Edit | แก้ไขราคา/รายละเอียด/skillLevel สินค้าเดิม | product เดิม | ข้อมูลอัปเดต ราคาที่แสดงฝั่ง customer เปลี่ยนตาม แต่ order เก่าไม่เปลี่ยน (snapshot) | | |
| ADM-09 | Manage Product — Set SkillLevel | ตั้งค่า skillLevel = beginner ให้สินค้า | product 1 ชิ้น | สินค้าถูก tag beginner, ฝั่ง customer filter ด้วย skillLevel=beginner เจอสินค้านี้ | | |
| ADM-10 | Manage User — View List | เข้าหน้ารายชื่อผู้ใช้ทั้งหมด | - | แสดงรายชื่อ user ทุก role พร้อมสถานะ | | |
| ADM-11 | Manage User — Suspend/Ban | เปลี่ยนสถานะ user เป็น banned | customer account ทดสอบ | user ไม่สามารถ login ได้อีก จนกว่าจะถูกปลด ban | | |
| ADM-12 | Sales Report | เข้าหน้ารายงานยอดขาย เลือกช่วงวันที่ | date range 1 เดือน | แสดงยอดขายรวม, สินค้าขายดี ตรงกับข้อมูล order จริงในระบบ | | |
| ADM-13 | Inventory Report | เข้าหน้ารายงานสต็อก | - | แสดง InventorySnapshot รายสินค้า (stockLevel, status In Stock/Low/Critical) | | |
| ADM-14 | Financial Report | เข้าหน้ารายงานการเงิน | - | แสดงรายรับรวม (จาก DailySalesReport) ตรงกับยอดขายใน Sales Report | | |
