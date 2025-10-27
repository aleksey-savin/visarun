/*
  Warnings:

  - Added the required column `exchangeRate` to the `CurrencyExchange` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CurrencyExchange" ADD COLUMN     "exchangeRate" DECIMAL(65,30) NOT NULL;
