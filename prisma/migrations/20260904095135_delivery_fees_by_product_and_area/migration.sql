-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingZone" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shippingFee" INTEGER NOT NULL DEFAULT 7900;

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingZone_sortOrder_idx" ON "ShippingZone"("sortOrder");
