/*
  Warnings:

  - You are about to drop the column `visaTypeId` on the `VisaCitizenshipSurcharge` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VisaCitizenshipSurcharge" DROP CONSTRAINT "VisaCitizenshipSurcharge_visaTypeId_fkey";

-- AlterTable
ALTER TABLE "VisaCitizenshipSurcharge" DROP COLUMN "visaTypeId";

-- CreateTable
CREATE TABLE "VisaCitizenshipSurchargeVisaType" (
    "id" TEXT NOT NULL,
    "surchargeId" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,

    CONSTRAINT "VisaCitizenshipSurchargeVisaType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisaCitizenshipSurchargeVisaType_surchargeId_visaTypeId_key" ON "VisaCitizenshipSurchargeVisaType"("surchargeId", "visaTypeId");

-- AddForeignKey
ALTER TABLE "VisaCitizenshipSurchargeVisaType" ADD CONSTRAINT "VisaCitizenshipSurchargeVisaType_surchargeId_fkey" FOREIGN KEY ("surchargeId") REFERENCES "VisaCitizenshipSurcharge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaCitizenshipSurchargeVisaType" ADD CONSTRAINT "VisaCitizenshipSurchargeVisaType_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
