/*
  Warnings:

  - A unique constraint covering the columns `[abbreviation]` on the table `Citizenship` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `abbreviation` to the `Citizenship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emoji` to the `Citizenship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Citizenship" ADD COLUMN     "abbreviation" TEXT NOT NULL,
ADD COLUMN     "emoji" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Citizenship_abbreviation_key" ON "Citizenship"("abbreviation");
