-- AlterTable
ALTER TABLE "Country" ADD COLUMN     "globalMultivisaExtraCost" DOUBLE PRECISION,
ADD COLUMN     "multivisaIsGlobal" BOOLEAN NOT NULL DEFAULT false;
