/*
  Warnings:

  - You are about to drop the column `begottenByCurancyExchangeId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_begottenByCurancyExchangeId_fkey";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "begottenByCurancyExchangeId",
ADD COLUMN     "begottenByCurrencyExchangeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_begottenByCurrencyExchangeId_fkey" FOREIGN KEY ("begottenByCurrencyExchangeId") REFERENCES "public"."CurrencyExchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
