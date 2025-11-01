/*
  Warnings:

  - A unique constraint covering the columns `[currencyExchangeId]` on the table `BankingDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."BankingDetails" ADD COLUMN     "currencyExchangeId" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "BankingDetails_currencyExchangeId_key" ON "public"."BankingDetails"("currencyExchangeId");

-- AddForeignKey
ALTER TABLE "public"."BankingDetails" ADD CONSTRAINT "BankingDetails_currencyExchangeId_fkey" FOREIGN KEY ("currencyExchangeId") REFERENCES "public"."CurrencyExchange"("id") ON DELETE CASCADE ON UPDATE CASCADE;
