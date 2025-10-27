-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "begottenByCurancyExchangeId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_begottenByCurancyExchangeId_fkey" FOREIGN KEY ("begottenByCurancyExchangeId") REFERENCES "public"."CurrencyExchange"("id") ON DELETE SET NULL ON UPDATE CASCADE;
