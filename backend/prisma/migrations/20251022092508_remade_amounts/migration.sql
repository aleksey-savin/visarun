/*
  Warnings:

  - You are about to drop the column `amount` on the `CurrencyExchange` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."CurrencyExchange" DROP COLUMN "amount",
ADD COLUMN     "amountFrom" DECIMAL(65,30),
ADD COLUMN     "amountTo" DECIMAL(65,30),
ADD COLUMN     "minTransactionAmountInSelectedCurrency" DECIMAL(65,30);
