-- AlterTable
ALTER TABLE "VisaType" ADD COLUMN     "accelerationAvailable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "accelerationCost" DOUBLE PRECISION;
