-- CreateEnum
CREATE TYPE "inventory_action" AS ENUM ('receive', 'adjust', 'reserve', 'release', 'sale_deduct');

-- CreateTable
CREATE TABLE "inventory" (
    "inventory_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "order_id" UUID,
    "before_qty" INTEGER NOT NULL,
    "after_qty" INTEGER NOT NULL,
    "change_qty" INTEGER NOT NULL,
    "action" "inventory_action" NOT NULL,
    "staff_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_key" ON "inventory"("product_id");

-- CreateIndex
CREATE INDEX "idx_inventory_logs_product_id" ON "inventory_logs"("product_id");

-- CreateIndex
CREATE INDEX "idx_inventory_logs_order_id" ON "inventory_logs"("order_id");

-- CreateIndex
CREATE INDEX "idx_inventory_logs_staff_id" ON "inventory_logs"("staff_id");

-- CreateIndex
CREATE INDEX "idx_inventory_logs_created_at" ON "inventory_logs"("created_at");
