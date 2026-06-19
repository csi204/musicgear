# 🎸 MusicGear — Project Design Document

> ระบบ E-Commerce สำหรับร้านขายเครื่องดนตรีและอุปกรณ์ดนตรีออนไลน์ รองรับ 4 บทบาทผู้ใช้งาน: **Guest, Customer, Staff, Admin**

---

## 📚 สารบัญ

1. [Brand Identity & Color Palette](#-brand-identity--color-palette)
2. [Logo Generation Prompt](#-logo-generation-prompt)
3. [Tech Stack](#-tech-stack)
4. [Requirement](#-requirment)
5. [User Personas](#-user-personas)
6. [Use Case Diagram](#-use-case-diagram)
7. [Class Diagram](#-class-diagram)
8. [Sequence Diagrams](#-sequence-diagrams)
9. [Wireframe](#-wire-frame)
10. [System Architecture](#-system-architecture)
11. [Data schema](#-data-schema)
12. [User Accept Testing: UAT (Manual Testing)](#-user-accept-testing-UAT-(manual-testing))

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

## 🧰 Tech Stack

| หมวด | เทคโนโลยี | รายละเอียด |
|---|---|---|
| **Frontend** | Next.js + TypeScript | Framework: Vinext |
| **Backend** | Node.js (JavaScript) | Runtime |
| **Backend Framework** | Hono | Lightweight backend framework |
| **ORM** | Prisma (+ adapter-neon) | จัดการฐานข้อมูล |
| **Database** | PostgreSQL (Neon DB) | Serverless Postgres |
| **Storage Images** | Cloudflare R2 | ตัวเก็บรูป |
| **Caching ** | Redis (Upstash) | สำหรับทำcart(caching) |
| **Auth** | Kinde SDK | ระบบ Authentication |
| **Validation** | Zod | Validate ข้อมูล |
| **Payment** | Omise SDK | ระบบชำระเงิน |
| **Styling** | Tailwind CSS + shadcn/ui | ออกแบบ UI และ component |
| **Deployment (Frontend)** | Cloudflare Pages | โฮสต์ฝั่ง frontend |
| **Deployment (Backend)** | Cloudflare Workers | โฮสต์ฝั่ง backend |
| **DevOps** | Wrangler CLI, Git, GitHub | Deploy & version control |
| **API Testing** | Postman | ทดสอบ API |
| **Design** | Figma | ออกแบบ UI/UX |

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
    8. ระบบจัดการสินค้าและคำสั่งซื้อสำหรับ Staff/Admin  
    9. รายงาน/Dashboard  
    10. ระบบแนะนำอุปกรณ์ที่เหมาะสำหรับมือใหม่ (Beginner)  
    11. ระบบแนะนำสินค้าที่ใช้ร่วมกันได้ + Bundle Set  
    12. ระบบเปรียบเทียบสินค้า (Compare Product)  
    13. ระบบแจ้งเตือนทางอีเมลเมื่อสินค้าเข้าสต็อก (Back-in-stock notification)

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
- ดูค่าอธิบายแบบภาษาคนทั่วไป ไม่ต้องอิงศัพท์เทคนิคเยอะ
- จัดเซ็ตเริ่มต้นมาให้ครบ ซื้อของกล่องเดียวพร้อมเล่น
- มีให้เทียบเปรียบเทียบสินค้า เพื่อตัดสินใจซื้อง่ายขึ้น
- แพ็กเกจชัดเจนบอกว่าตัวไหนเหมาะกับระดับเริ่มต้น

---

### 🔧 Persona 2 — Staff: "นอท"
**อายุ:** 23 ปี | พนักงานดูแลคลังและจัดเตรียมสินค้า | **เป้าหมาย:** จัดเตรียมและแพ็กสินค้าให้ถูกต้อง รวดเร็ว

> *"ลูกค้าขอถามและสั่งซื้อสินค้าหลายชิ้นพร้อมกันเพราะกลัวต้องใช้ด้วยกันไม่ได้ แต่ในระบบคลังเราแยกเช็กทีละชิ้น ถ้าสินค้าชิ้นใดชิ้นหนึ่งหรือใครเข้าไปไม่ชัดเจน ระบบเวลาหยิบของมาจะวุ่นวายมาก"*

**🩹 Pain Points**
- จัดการความเข้าใจของสินค้าในสต็อกได้ไม่ตรงกัน เมื่อลูกค้าสั่งซื้อชุดสินค้าหรือจับคู่สินค้ามา Staff ต้องเสียเวลาตรวจสอบหน้างานตอนแพ็ก อุปกรณ์ขึ้นนี้สายเคิก แอมป์ มันตรงรุ่นและเข้ากันได้จริงตามที่ลูกค้าต้องการหรือไม่ เมื่อจากข้อมูลในคลังไม่ได้พูกความเข้าใจไว้ชัดเจน
- ปัญหาการตัดสต็อกสินค้าที่สัมพันธ์กัน: หากสินค้าชิ้นใดชิ้นหนึ่งในเซ็ตหมด แต่ระบบไม่แจ้งเตือนความสัมพันธ์ล่วงหน้า เสียเวลาต้องประสานงานหรือเปลี่ยนสินค้า

**🎯 Needs & Motivations**
- ระบบแจ้งข้อมูลความสัมพันธ์ของสินค้าหรือเซ็ตสต็อกสินค้าให้เข้ากันได้ ในหน้าที่สั่งซื้อชัดเจน เพื่อให้หยิบและแพ็กของได้ถูกต้อง ไม่ต้องเดาเอง
- หน้า Dashboard แสดงสถานะสต็อกของและกลุ่มสินค้าแนะนำสำหรับมือใหม่ เพื่อเตรียมแพ็กได้ล่วงหน้า

---

### 📊 Persona 3 — Admin: "แนท"
**อายุ:** 29 ปี | ผู้ดูแลระบบและจัดการคอนเทนต์สินค้า | **เป้าหมาย:** เพิ่ม ลบ แก้ไขข้อมูลสินค้า และจัดหมวดหมู่สินค้าให้เข้าใจง่าย เพื่อช่วยให้ลูกค้าตัดสินใจซื้อได้เร็วที่สุดโดยไม่ต้องลองถามเพิ่ม

> *"การจัดหมวดหมู่และละเอียดสินค้าดนตรีให้มือใหม่เข้าใจง่ายเป็นเรื่องท้าทายมาก ถ้าเราเชื่อมโยงสินค้าที่เข้ากันได้ดี ข้อมูลจะดูรกและช่วยลูกค้า"*

**🩹 Pain Points**
- ความยุ่งยากในการซื้อโยงหมวดหมู่สินค้า: การลงข้อมูลสินค้าเพื่อตอบโจทย์ความเข้ากันได้ ทำได้ยาก เพราะระบบเดิมต้องใส่รายละเอียดแยกกัน ทำให้ Admin ต้องพิมพ์ข้อความเทคนิคซ้ำๆ ในทุกหน้าสินค้า แทนที่จะสามารถผูกแท็ก ระดับสินค้ามือใหม่หรือจัดกลุ่มหมวดหมู่ที่เกี่ยวข้องกันได้ในที่เดียว
- การสกัดข้อมูลรายงานเพื่อจัดเตรียมสินค้า: เมื่อต้องการดูว่าสินค้าไหนขายดีพื้นที่นำมาจับเซ็ตโปรโมชัน ระบบรายงานไม่แยกแยะตามระดับผู้ใช้งาน ทำให้จัดเตรียมสินค้าเข้าใจยาก

**🎯 Needs & Motivations**
- ฟังก์ชันการจัดการหมวดหมู่ (Category Management) ที่รองรับใส่ป้ายกำกับ (เช่น "ระดับเริ่มต้น ราคาเป็นมิตร") หรือผูกสินค้าที่เกี่ยวข้องกันเข้าไว้ได้ในที่เดียว
- รายงานสินค้าคงคลัง (Inventory Report) ที่สรุปได้ว่าสินค้าคู่ไหนมักจะถูกซื้อร่วมกัน เพื่อนำมาปรับปรุงข้อมูลหน้าให้ตรงกับผู้ใช้งาน

---

## 🧩 Use Case Diagram

```mermaid
%% Mermaid ไม่มี usecase diagram แบบ native จริงๆ
%% เลยจำลองด้วย flowchart: actor = สี่เหลี่ยมมน, usecase = วงรี (stadium shape)
flowchart LR

    Customer(["👤 Customer"])
    Staff(["👤 Staff"])
    Guest(["👤 Guest"])
    Admin(["👤 Admin"])

    %% ===== Customer Use Cases =====
    subgraph CustomerUC["Customer"]
        direction LR
        UC_Register(("Register / Login"))
        UC_ManageAcc(("Manage account"))
        UC_Search(("Search"))
        UC_Browse(("Browse Item"))
        UC_Filter(("Filter brand type..."))
        UC_Cart(("Manage Cart"))
        UC_Compare(("Compare a product"))
        UC_Notify(("Receive Notification"))
        UC_Review(("Review(star)"))
        UC_Address(("Manage Address"))
        UC_History(("History"))
        UC_Details(("Watch details"))
        UC_Tracking(("Tracking order"))
        UC_AddCart(("Add to cart"))
        UC_Buy(("Buy Items"))
        UC_Confirm(("Confirm order"))
        UC_Pay(("Payments"))
        UC_Select(("Select"))
    end

    Customer --- UC_Register
    Customer --- UC_ManageAcc
    Customer --- UC_Browse
    Customer --- UC_Cart
    Customer --- UC_Compare
    Customer --- UC_Notify
    Customer --- UC_Address
    Customer --- UC_Details
    Customer --- UC_AddCart
    Customer --- UC_Buy
    Customer --- UC_Pay
    Customer --- UC_Review
    Customer --- UC_History
    Customer --- UC_Tracking

    UC_ManageAcc -.->|"<<extend>>"| UC_Search
    UC_Browse -.->|"<<extend>>"| UC_Filter
    UC_Buy -.->|"<<include>>"| UC_Confirm
    UC_Pay -.->|"<<include>>"| UC_Select

    %% ===== Staff Use Cases =====
    subgraph StaffUC["Staff"]
        direction LR
        UC_ReviewOrder(("Review and confirm order"))
        UC_Login2(("Login"))
        UC_Prepare(("Prepare product / pack product"))
        UC_ViewOrders(("View all order list"))
        UC_UpdateStatus(("Update order status"))
        UC_DashReport(("Manage Dashboard Report"))
        UC_CheckStock(("Check stock"))
        UC_Receiving(("Receiving product"))
        UC_StockProduct(("Manage Stock Product"))
        UC_ManageStock(("Manage stock"))
        UC_BundleSet(("Manage bundle set"))
    end

    Staff --- UC_Login2
    Staff --- UC_ReviewOrder
    Staff --- UC_Prepare
    Staff --- UC_ViewOrders
    Staff --- UC_UpdateStatus
    Staff --- UC_DashReport
    Staff --- UC_StockProduct

    UC_CheckStock -.->|"<<include>>"| UC_StockProduct
    UC_Receiving -.->|"<<include>>"| UC_StockProduct
    UC_ManageStock -.->|"<<include>>"| UC_StockProduct
    UC_StockProduct -.->|"<<extend>>"| UC_BundleSet

    %% ===== Guest Use Cases =====
    subgraph GuestUC["Guest"]
        direction LR
        UC_GSearch(("Search"))
        UC_GAddCart(("Add to cart"))
        UC_GFilter(("Filter brand type..."))
        UC_GBrowse(("Browse Item"))
    end

    Guest --- UC_GSearch
    Guest --- UC_GBrowse
    UC_GSearch -.->|"<<extend>>"| UC_GAddCart
    UC_GFilter -.->|"<<extend>>"| UC_GBrowse

    %% ===== Admin Use Cases =====
    subgraph AdminUC["Admin"]
        direction LR
        UC_ALogin(("Login"))
        UC_Dashboard(("Dashboard"))
        UC_Category(("Manage Category"))
        UC_Product(("Manage Product"))
        UC_Financial(("Financial results report"))
        UC_Inventory(("Inventory Report"))
        UC_ManageUser(("Manage User"))
        UC_SalesReport(("Sales report"))
    end

    Admin --- UC_ALogin
    Admin --- UC_Dashboard
    Admin --- UC_Category
    Admin --- UC_Product
    Admin --- UC_Financial
    Admin --- UC_Inventory
    Admin --- UC_ManageUser
    Admin --- UC_SalesReport
```

---

## 🏗️ Class Diagram

```mermaid
classDiagram

    class User {
        <<abstract>>
        +UUID userID
        +string email
        +string passwordHash
        +string firstName
        +string lastName
        +string phone
        +UserStatus status
        +datetime createAt
        +datetime updateAt
        +login(email, password) boolean
        +logout() void
        +updateProfile() void
        +changePassword() void
    }

    class Guest {
        +string sessionId
        +browsProduct() void
        +searchProduct() void
    }

    class Customer {
        +date dateOfBirth
        +string gender
        +datetime createAt
        +datetime updateAt
        +manageProfile() void
        +viewOrderHistory() void
        +manageAddress() void
        +addReview() void
    }

    class Staff {
        +string position
        +datetime createAt
        +datetime updateAt
        +manageProduct() void
        +manageOrder() void
        +manageStock() void
    }

    class Admin {
        +datetime createAt
        +datetime updateAt
        +manageUser() void
        +viewDashboard() void
        +manageSystem() void
    }

    class Address {
        +UUID addressId
        +UUID customerId
        +string receiverName
        +string phone
        +string addressLine1
        +string addressLine2
        +string province
        +string city
        +string postalCode
        +boolean isDefault
        +dateTime createdAt
        +dateTime updateAt
    }

    class Cart {
        +UUID cartId
        +UUID customerId
        +string sessionId
        +datetime createAt
        +datetime updateAt
    }

    class CartItem {
        +UUID cartItemId
        +UUID cartId
        +UUID productId
        +int quantity
        +decimal price
    }

    class Order {
        +UUID orderId
        +UUID customerId
        +datetime orderDate
        +string shippingAddressSnapshot
        +decimal totalAmount
        +OrderStatus status
        +decimal shippingFee
        +decimal discountAmount
        +decimal grandTotal
        +string remark
    }

    class OrderItem {
        +UUID orderItemId
        +UUID orderId
        +UUID productId
        +int quantity
        +decimal unitPrice
        +decimal totalPrice
    }

    class Review {
        +UUID reviewId
        +UUID customerId
        +UUID productId
        +int rating
        +string comment
        +datetime createAt
    }

    class Notification {
        +UUID notificationId
        +UUID customerId
        +string title
        +string message
        +NotificationType type
        +NotificationStatus status
        +boolean isRead
    }

    class Payment {
        +UUID paymentId
        +UUID orderId
        +string paymentMethod
        +string provider
        +decimal amount
        +PaymentStatus status
        +string transactionRef
        +datetime paidAt
        +datetime createAt
    }

    class Shipment {
        +UUID shipmentId
        +UUID orderId
        +string trackingNumber
        +string carrier
        +ShippingStatus shippingStatus
        +datetime shippingDate
        +datetime deliveredDate
    }

    class Product {
        +UUID productId
        +string name
        +string description
        +decimal price
        +string sku
        +ProductStatus status
        +UUID brandId
        +UUID categoryId
        +datetime createAt
        +datetime updateAt
        +updateStock(quantity: int) void
    }

    class Category {
        +UUID categoryId
        +string name
        +string description
    }

    class Brand {
        +UUID brandId
        +string name
        +string description
    }

    class Inventory {
        +UUID inventoryId
        +UUID productId
        +int quantity
        +int reservedQuantity
        +dateTime updatedAt
    }

    class ProductImage {
        +UUID imageId
        +UUID productId
        +string imageUrl
        +boolean isPrimary
        +dateTime createdAt
    }

    class Bundle {
        +UUID bundleId
        +string name
        +string description
        +string discountType
        +decimal discountValue
        +dateTime createdAt
        +dateTime updateAt
    }

    class BundleItem {
        +UUID bundleItemId
        +UUID bundleId
        +UUID productId
        +int quantity
    }

    %% Inheritance
    Customer --|> User
    Staff --|> User
    Admin --|> User

    %% Customer relations
    Customer "1" --> "0..*" Address
    Customer "1" --> "0..1" Cart
    Customer "1" --> "0..*" Order
    Customer "1" --> "0..*" Review
    Customer "1" --> "0..*" Notification

    %% Guest relations
    Guest "1" --> "0..1" Cart

    %% Cart relations
    Cart "1" --> "0..*" CartItem
    CartItem "0..*" --> "1" Product

    %% Order relations
    Order "1" --> "1..*" OrderItem
    Order "1" --> "0..*" Payment
    Order "1" --> "0..*" Shipment
    OrderItem "0..*" --> "1" Product

    %% Review relation
    Review "0..*" --> "1" Product

    %% Product relations
    Product "0..*" --> "1" Category
    Product "0..*" --> "1" Brand
    Product "1" --> "1" Inventory
    Product "1" --> "0..*" ProductImage

    %% Bundle relations
    Bundle "1" --> "1..*" BundleItem
    BundleItem "0..*" --> "1" Product
```

---

## 🔁 Sequence Diagrams

### 1. Customer

```mermaid
sequenceDiagram
    autonumber
    actor C as Customer
    participant GW as API Gateway
    participant Auth as Auth Service (Kinde)
    participant US as User Service
    participant PS as Product Service
    participant CS as Cart Service
    participant Redis as Redis (Cart DB)
    participant OS as Order Service
    participant Inv as Inventory
    participant Pay as Payment Service
    participant Omise as Omise
    participant Notif as Notification Service
    participant Resend as Resend

    %% Register / Login
    C->>GW: POST /register หรือ /login
    GW->>Auth: Authenticate(email, password)
    Auth->>US: Verify / Create User
    US-->>Auth: User Info
    Auth-->>GW: JWT Token
    GW-->>C: Login Success (Token)

    %% Browse & Search
    C->>GW: GET /products?search=&brand=&type=
    GW->>PS: searchProduct(keyword, filter)
    PS-->>GW: Product List
    GW-->>C: แสดงรายการสินค้า

    %% Add to Cart
    C->>GW: POST /cart/add (productId, qty)
    GW->>CS: addToCart(customerId, productId, qty)
    CS->>Redis: Save CartItem
    Redis-->>CS: OK
    CS-->>GW: Cart Updated
    GW-->>C: ตะกร้าอัปเดตแล้ว

    %% Checkout / Place Order
    C->>GW: POST /order/checkout (addressId)
    GW->>OS: createOrder(cart, address)
    OS->>Inv: checkStock(productId, qty)
    Inv-->>OS: Stock Available
    OS->>OS: คำนวณ total, shippingFee, grandTotal
    OS-->>GW: Order Created (pending payment)
    GW-->>C: สรุปคำสั่งซื้อ

    %% Payment
    C->>GW: POST /payment (orderId, method)
    GW->>Pay: processPayment(orderId, amount)
    Pay->>Omise: chargePayment(amount, token)
    Omise-->>Pay: Payment Result
    Pay->>OS: updateOrderStatus(paid)
    Pay-->>GW: Payment Success
    GW-->>C: ยืนยันการชำระเงิน

    %% Notification
    OS->>Notif: sendOrderConfirmation(customerId, orderId)
    Notif->>Resend: sendEmail(customer)
    Resend-->>Notif: Email Sent
    Notif-->>C: Push Notification (Order Confirmed)

    %% Track Order
    C->>GW: GET /order/{orderId}/status
    GW->>OS: getOrderStatus(orderId)
    OS-->>GW: Order Status
    GW-->>C: แสดงสถานะ Tracking

    %% Review
    C->>GW: POST /review (productId, rating, comment)
    GW->>PS: addReview(customerId, productId, rating, comment)
    PS-->>GW: Review Saved
    GW-->>C: รีวิวถูกบันทึกแล้ว
```

### 2. Staff

```mermaid
sequenceDiagram
    autonumber
    actor S as Staff
    participant GW as API Gateway
    participant Auth as Auth Service
    participant OS as Order Service
    participant Inv as Inventory
    participant PS as Product Service
    participant Notif as Notification Service
    participant Rep as Report Service

    %% Login
    S->>GW: POST /login
    GW->>Auth: Authenticate(email, password)
    Auth-->>GW: JWT Token
    GW-->>S: Login Success

    %% View Order List
    S->>GW: GET /orders
    GW->>OS: getAllOrders()
    OS-->>GW: Order List
    GW-->>S: แสดงรายการคำสั่งซื้อ

    %% Confirm Order
    S->>GW: PUT /order/{id}/confirm
    GW->>OS: reviewAndConfirmOrder(orderId)
    OS-->>GW: Order Confirmed
    GW-->>S: สถานะอัปเดต

    %% Prepare / Pack Product
    S->>GW: PUT /order/{id}/prepare
    GW->>OS: prepareProduct(orderId)
    OS->>Inv: reserveStock(productId, qty)
    Inv-->>OS: Stock Reserved
    OS-->>GW: Product Packed
    GW-->>S: สถานะ: Packed

    %% Update Order Status -> Shipment
    S->>GW: PUT /order/{id}/status (shipped)
    GW->>OS: updateOrderStatus(orderId, shipped)
    OS->>Notif: notifyCustomer(orderId, shipped)
    Notif-->>OS: Notification Sent
    OS-->>GW: Status Updated
    GW-->>S: ยืนยันแล้ว

    %% Receiving Product / Manage Stock
    S->>GW: POST /inventory/receive (productId, qty)
    GW->>Inv: receivingProduct(productId, qty)
    Inv->>Inv: updateStock(quantity)
    Inv-->>GW: Stock Updated
    GW-->>S: สต็อกอัปเดตแล้ว

    %% Check Stock
    S->>GW: GET /inventory/check?productId=
    GW->>Inv: checkStock(productId)
    Inv-->>GW: Current Stock Level
    GW-->>S: แสดงข้อมูลสต็อก

    %% Manage Bundle Set
    S->>GW: POST /product/bundle (bundleItems)
    GW->>PS: manageBundleSet(bundleData)
    PS-->>GW: Bundle Created
    GW-->>S: บันทึกชุดสินค้าแล้ว

    %% Dashboard Report
    S->>GW: GET /dashboard/report
    GW->>Rep: getDashboardReport()
    Rep-->>GW: Report Data
    GW-->>S: แสดง Dashboard
```

### 3. Admin

```mermaid
sequenceDiagram
    autonumber
    actor A as Admin
    participant GW as API Gateway
    participant Auth as Auth Service
    participant US as User Service
    participant PS as Product Service
    participant OS as Order Service
    participant Inv as Inventory
    participant Pay as Payment Service
    participant Rep as Report Service
    participant R2 as R2 Image Storage

    %% Login
    A->>GW: POST /login
    GW->>Auth: Authenticate(email, password)
    Auth-->>GW: JWT Token
    GW-->>A: Login Success

    %% View Dashboard
    A->>GW: GET /admin/dashboard
    GW->>Rep: getDashboardSummary()
    Rep-->>GW: Summary Data (sales, users, orders)
    GW-->>A: แสดง Dashboard

    %% Manage Category
    A->>GW: POST /category (name, description)
    GW->>PS: createCategory(data)
    PS-->>GW: Category Created
    GW-->>A: บันทึกหมวดหมู่แล้ว

    %% Manage Product
    A->>GW: POST /product (productData, images)
    GW->>PS: createProduct(productData)
    PS->>R2: uploadImage(images)
    R2-->>PS: Image URL
    PS-->>GW: Product Created
    GW-->>A: บันทึกสินค้าแล้ว

    A->>GW: PUT /product/{id} (update)
    GW->>PS: updateProduct(productId, data)
    PS-->>GW: Product Updated
    GW-->>A: อัปเดตแล้ว

    %% Manage User
    A->>GW: GET /admin/users
    GW->>US: getAllUsers()
    US-->>GW: User List
    GW-->>A: แสดงรายชื่อผู้ใช้

    A->>GW: PUT /admin/user/{id} (status)
    GW->>US: manageUser(userId, status)
    US-->>GW: User Updated
    GW-->>A: ยืนยันแล้ว

    %% Inventory Report
    A->>GW: GET /report/inventory
    GW->>Rep: getInventoryReport()
    Rep->>Inv: fetchStockData()
    Inv-->>Rep: Stock Data
    Rep-->>GW: Inventory Report
    GW-->>A: แสดงรายงานสต็อก

    %% Sales Report
    A->>GW: GET /report/sales
    GW->>Rep: getSalesReport()
    Rep->>OS: fetchOrderData()
    OS-->>Rep: Order Data
    Rep-->>GW: Sales Report
    GW-->>A: แสดงรายงานยอดขาย

    %% Financial Results Report
    A->>GW: GET /report/financial
    GW->>Rep: getFinancialReport()
    Rep->>Pay: fetchPaymentData()
    Pay-->>Rep: Payment Data
    Rep-->>GW: Financial Report
    GW-->>A: แสดงรายงานผลลัพธ์ทางการเงิน
```

---

## 🖥️ System Architecture

```mermaid
flowchart TB

    %% ===== Client Layer =====
    subgraph ClientLayer["Client Layer"]
        WebApp["💻 Customer Web App"]
        AdminPortal["📋 Admin Portal"]
        StaffPortal["📋 Staff Portal"]
    end

    %% ===== API Gateway =====
    subgraph GatewayLayer["API Gateway"]
        APIGW(("🌐 API Gateway"))
    end

    %% ===== Microservices =====
    subgraph Microservices["Microservice Layout"]
        UserSvc["👤 User Service"]
        ProductSvc["📦 Product Service"]
        OrderSvc["📋 Order Service"]
        CartSvc["🛒 Cart Service"]
        PaymentSvc["💳 Payment Service"]
        NotifSvc["🔔 Notification Service"]
        ReportSvc["👤 Report Service"]
        AuthSvc["👤 Auth Service"]
    end

    %% ===== Data Layer =====
    subgraph DataLayer["Data Layer"]
        UserDB[("User DB")]
        ProductDB[("Product DB")]
        OrderDB[("Order DB")]
        RedisCart[("Redis (Cart)")]
        PaymentDB[("Payment DB")]
        NotifDB[("Notification DB")]
        ReportDB[("Report DB")]
        R2Storage[("R2 Images Storage")]
        InventoryDB[("inventory DB")]
    end

    %% ===== External Services =====
    subgraph ExternalServices["External Services"]
        Omise["💳 Omise"]
        Resend["✉️ Resend"]
        Kinde["🔑 Kinde"]
    end

    %% ----- Client -> Gateway -----
    WebApp --> APIGW
    AdminPortal --> APIGW

    %% ----- Gateway -> Services -----
    APIGW --> UserSvc
    APIGW --> ProductSvc
    APIGW --> OrderSvc
    APIGW --> CartSvc
    APIGW --> PaymentSvc
    APIGW --> NotifSvc

    %% ----- Inter-service flow -----
    CartSvc -- "Checkout" --> OrderSvc
    PaymentSvc -- "Process / stock event" --> OrderSvc
    OrderSvc -- "data order selled" --> ReportSvc
    CartSvc -- "data Successful Transactions" --> ReportSvc
    ProductSvc -- "Stock Inventory" --> ReportSvc
    UserSvc -- "User Growth Rate" --> ReportSvc
    ProductSvc -- "images" --> AuthSvc
    AuthSvc -. "auth" .-> Kinde
    PaymentSvc -. "charge" .-> Omise
    NotifSvc -. "email" .-> Resend

    %% ----- Services -> own DB -----
    UserSvc --> UserDB
    ProductSvc --> ProductDB
    OrderSvc --> OrderDB
    CartSvc --> RedisCart
    PaymentSvc --> PaymentDB
    NotifSvc --> NotifDB
    ReportSvc --> ReportDB
    ProductSvc --> R2Storage
    ProductSvc --> InventoryDB
```

---

## 🎯 Wireframe / Prototype - Clik to inspect
[![Design System](https://raw.githubusercontent.com/csi204/musicgear/main/images/Prototype.png)](https://www.figma.com/design/RSQ1FfYVF5qJZzgem9ntBt/Untitled?node-id=0-1&t=H5nnEYQtm8Cw6YVe-1)

# Data Schema (JSON)
```json
{
  "name": "string",
  "age": "integer",
  "isActive": "boolean"
}
```

# User Acceptance Testing: UAT (Manual Testing)


---

> 💡 **Tip:** เมื่อได้ผลลัพธ์จาก Stitch แล้ว สามารถ copy โทนสี (`#0B0B0E`, `#2F5DFF`, `#FF8A3D`, `#F5F3EE`) ไปตั้งเป็น CSS variables ใน Tailwind config เพื่อให้ดีไซน์ทุกหน้าจอสอดคล้องกันทั้งระบบ
