-- DropForeignKey
ALTER TABLE "CurrencyExchange" DROP CONSTRAINT "CurrencyExchange_fromCurrencyId_fkey";

-- DropForeignKey
ALTER TABLE "CurrencyExchange" DROP CONSTRAINT "CurrencyExchange_toCurrencyId_fkey";

-- AlterTable
ALTER TABLE "CurrencyExchange" ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "amountInSelectedCurrencyFrom" DROP NOT NULL,
ALTER COLUMN "amountInSelectedCurrencyTo" DROP NOT NULL,
ALTER COLUMN "fromCurrencyId" DROP NOT NULL,
ALTER COLUMN "toCurrencyId" DROP NOT NULL,
ALTER COLUMN "exchangeRate" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CurrencyExchange" ADD CONSTRAINT "CurrencyExchange_fromCurrencyId_fkey" FOREIGN KEY ("fromCurrencyId") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrencyExchange" ADD CONSTRAINT "CurrencyExchange_toCurrencyId_fkey" FOREIGN KEY ("toCurrencyId") REFERENCES "currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
