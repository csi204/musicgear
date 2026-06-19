# Musicgear

# Persona Design


# Use Case Diagram
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

# Class Diagram

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
        +UUID customerID
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
        +int staffID
        +string position
        +datetime createAt
        +datetime updateAt
        +manageProduct() void
        +manageOrder() void
        +manageStock() void
    }

    class Admin {
        +UUID adminId
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
        +datetime addressDate
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
    Guest ..> User : extends-like

    %% Customer relations
    Customer "1" --> "0..*" Address
    Customer "1" --> "0..1" Cart
    Customer "1" --> "0..*" Order
    Customer "1" --> "0..*" Review
    Customer "1" --> "0..*" Notification

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

#Sequence Diagram
   1. Customer
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
  2. Staff
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
  3. Admin
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

#Wirefram or Prototype


# System Architecture
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

# Data Schema (JSON)
```json
{
  "name": "string",
  "age": "integer",
  "isActive": "boolean"
}
```

# User Acceptance Testing: UAT (Manual Testing)
