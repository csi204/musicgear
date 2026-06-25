-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order_update', 'back_in_stock', 'promotion', 'system');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('sent', 'pending', 'failed');

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "orderId" UUID,
    "productId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'pending',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStaffAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "Notification"("orderId");

-- CreateIndex
CREATE INDEX "Notification_isStaffAlert_isRead_idx" ON "Notification"("isStaffAlert", "isRead");
