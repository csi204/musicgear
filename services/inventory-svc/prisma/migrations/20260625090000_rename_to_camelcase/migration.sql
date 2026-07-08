-- Rename tables from snake_case to camelCase (project naming convention)
ALTER TABLE "inventory" RENAME TO "Inventory";
ALTER TABLE "inventory_logs" RENAME TO "InventoryLog";

-- Rename enum type
ALTER TYPE "inventory_action" RENAME TO "InventoryAction";

-- Rename columns in Inventory
ALTER TABLE "Inventory" RENAME COLUMN "inventory_id" TO "inventoryId";
ALTER TABLE "Inventory" RENAME COLUMN "product_id" TO "productId";
ALTER TABLE "Inventory" RENAME COLUMN "reserved_quantity" TO "reservedQuantity";
ALTER TABLE "Inventory" RENAME COLUMN "updated_at" TO "updatedAt";

-- Rename primary key and unique constraint for Inventory
ALTER INDEX "inventory_pkey" RENAME TO "Inventory_pkey";
ALTER INDEX "inventory_product_id_key" RENAME TO "Inventory_productId_key";

-- Rename columns in InventoryLog
ALTER TABLE "InventoryLog" RENAME COLUMN "product_id" TO "productId";
ALTER TABLE "InventoryLog" RENAME COLUMN "order_id" TO "orderId";
ALTER TABLE "InventoryLog" RENAME COLUMN "before_qty" TO "beforeQty";
ALTER TABLE "InventoryLog" RENAME COLUMN "after_qty" TO "afterQty";
ALTER TABLE "InventoryLog" RENAME COLUMN "change_qty" TO "changeQty";
ALTER TABLE "InventoryLog" RENAME COLUMN "staff_id" TO "staffId";
ALTER TABLE "InventoryLog" RENAME COLUMN "created_at" TO "createdAt";

-- Rename primary key for InventoryLog
ALTER INDEX "inventory_logs_pkey" RENAME TO "InventoryLog_pkey";

-- Rename indexes
ALTER INDEX "idx_inventory_logs_product_id" RENAME TO "InventoryLog_productId_idx";
ALTER INDEX "idx_inventory_logs_order_id" RENAME TO "InventoryLog_orderId_idx";
ALTER INDEX "idx_inventory_logs_staff_id" RENAME TO "InventoryLog_staffId_idx";
ALTER INDEX "idx_inventory_logs_created_at" RENAME TO "InventoryLog_createdAt_idx";
