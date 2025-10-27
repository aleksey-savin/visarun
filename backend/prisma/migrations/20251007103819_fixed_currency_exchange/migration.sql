/*
  Warnings:

  - Added the required column `position` to the `CurrencyExchange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'currencyExchange';

-- DropForeignKey
ALTER TABLE "BankingDetails" DROP CONSTRAINT "BankingDetails_clientId_fkey";

-- AlterTable
ALTER TABLE "CurrencyExchange" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "canceledByClient" BOOLEAN,
ADD COLUMN     "position" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "BankingDetails" ADD CONSTRAINT "BankingDetails_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
