-- AlterTable
ALTER TABLE "Watch" ADD COLUMN     "additionalCosts" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "saleDate" TIMESTAMP(3),
ADD COLUMN     "salePrice" DECIMAL(65,30);
