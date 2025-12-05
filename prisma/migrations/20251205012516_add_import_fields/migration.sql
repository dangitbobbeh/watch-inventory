/*
  Warnings:

  - A unique constraint covering the columns `[importId]` on the table `Watch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "accessories" TEXT,
ADD COLUMN     "importId" TEXT,
ADD COLUMN     "purchaseShippingCost" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "salePlatform" TEXT,
ADD COLUMN     "year" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Watch_importId_key" ON "Watch"("importId");
