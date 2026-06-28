-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('preparing', 'shipped', 'in_transit', 'delivered', 'returned');

-- CreateTable
CREATE TABLE "Order" (
    "orderId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "addressId" UUID NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shippingAddressSnapshot" JSONB NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "shippingFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "remark" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "orderItemId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("orderItemId")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "shipmentId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'preparing',
    "shippingDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("shipmentId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_orderId_key" ON "Shipment"("orderId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;
