/*
  Warnings:

  - A unique constraint covering the columns `[tradedForWatchId]` on the table `Watch` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "tradeCounterparty" TEXT,
ADD COLUMN     "tradeValue" DECIMAL(65,30),
ADD COLUMN     "tradedForWatchId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Watch_tradedForWatchId_key" ON "Watch"("tradedForWatchId");

-- AddForeignKey
ALTER TABLE "Watch" ADD CONSTRAINT "Watch_tradedForWatchId_fkey" FOREIGN KEY ("tradedForWatchId") REFERENCES "Watch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
