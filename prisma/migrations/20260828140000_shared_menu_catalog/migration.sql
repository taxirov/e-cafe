-- Categories and dishes become a shared catalog across every cafe (like
-- e-mall's Category/CatalogProduct), instead of being per-cafe. This is a
-- pre-launch change — wipes existing orders/menu data (demo/seed only).

TRUNCATE TABLE "OrderItem", "Order", "MenuItemVariant", "MenuItem", "MenuCategory" CASCADE;

DROP TABLE "MenuItem" CASCADE;
DROP TABLE "MenuCategory" CASCADE;

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuCategory_name_key" ON "MenuCategory"("name");

-- CreateTable
CREATE TABLE "DishCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdByCafeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishCatalog_categoryId_idx" ON "DishCatalog"("categoryId");

-- CreateIndex
CREATE INDEX "DishCatalog_name_idx" ON "DishCatalog"("name");

-- AddForeignKey
ALTER TABLE "DishCatalog" ADD CONSTRAINT "DishCatalog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DishCatalog" ADD CONSTRAINT "DishCatalog_createdByCafeId_fkey" FOREIGN KEY ("createdByCafeId") REFERENCES "Cafe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "cafeId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "prepTimeMin" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MenuItem_cafeId_dishId_key" ON "MenuItem"("cafeId", "dishId");

-- CreateIndex
CREATE INDEX "MenuItem_cafeId_idx" ON "MenuItem"("cafeId");

-- CreateIndex
CREATE INDEX "MenuItem_dishId_idx" ON "MenuItem"("dishId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "DishCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (re-point MenuItemVariant at the recreated MenuItem table)
ALTER TABLE "MenuItemVariant" ADD CONSTRAINT "MenuItemVariant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (re-point OrderItem at the recreated MenuItem table)
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
