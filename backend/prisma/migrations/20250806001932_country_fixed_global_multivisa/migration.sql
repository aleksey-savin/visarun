/*
  Warnings:

  - You are about to drop the column `globalMultivisaExtraCost` on the `Country` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Country" DROP COLUMN "globalMultivisaExtraCost",
ADD COLUMN     "multivisaGlobalExtraCost" DOUBLE PRECISION;
