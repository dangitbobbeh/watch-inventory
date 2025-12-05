/*
  Warnings:

  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_watchId_fkey";

-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "marketingCosts" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "platformFees" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "purchaseSource" TEXT,
ADD COLUMN     "shippingCosts" DECIMAL(65,30) DEFAULT 0;

-- DropTable
DROP TABLE "Transaction";
