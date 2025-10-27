/*
  Warnings:

  - You are about to drop the column `customExchangeRate` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_senderId_fkey";

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "customExchangeRate",
ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "amountInSelectedCurrency" DROP NOT NULL,
ALTER COLUMN "senderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
