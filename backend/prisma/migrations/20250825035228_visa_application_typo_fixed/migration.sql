/*
  Warnings:

  - You are about to drop the column `stampIsReceived` on the `VisaApplication` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VisaApplication" DROP COLUMN "stampIsReceived",
ADD COLUMN     "stampIsRecieved" BOOLEAN NOT NULL DEFAULT false;
