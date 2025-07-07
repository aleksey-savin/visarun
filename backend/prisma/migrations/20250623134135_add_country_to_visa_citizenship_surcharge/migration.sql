/*
  Warnings:

  - Added the required column `countryId` to the `VisaCitizenshipSurcharge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VisaCitizenshipSurcharge" ADD COLUMN     "countryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "VisaCitizenshipSurcharge" ADD CONSTRAINT "VisaCitizenshipSurcharge_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
