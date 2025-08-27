/*
  Warnings:

  - You are about to drop the column `stampUntil` on the `VisaApplication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "stampUntil",
ADD COLUMN     "stampUntilDate" TIMESTAMP(3);
