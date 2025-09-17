/*
  Warnings:

  - You are about to drop the column `visarun` on the `VisarunRoute` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisarunRoute" DROP COLUMN "visarun",
ADD COLUMN     "visa" BOOLEAN NOT NULL DEFAULT false;
