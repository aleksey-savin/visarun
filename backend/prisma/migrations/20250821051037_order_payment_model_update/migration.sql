/*
  Warnings:

  - You are about to drop the column `acceptedBy` on the `OrderPayment` table. All the data in the column will be lost.
  - Added the required column `amountInSelectedCurrency` to the `OrderPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderPayment" DROP CONSTRAINT "OrderPayment_acceptedBy_fkey";

-- DropIndex
DROP INDEX "OrderPayment_acceptedBy_idx";

-- AlterTable
ALTER TABLE "OrderPayment" DROP COLUMN "acceptedBy",
ADD COLUMN     "acceptedById" TEXT,
ADD COLUMN     "amountInSelectedCurrency" DECIMAL(65,30) NOT NULL;

-- CreateIndex
CREATE INDEX "OrderPayment_acceptedById_idx" ON "OrderPayment"("acceptedById");

-- AddForeignKey
ALTER TABLE "OrderPayment" ADD CONSTRAINT "OrderPayment_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
