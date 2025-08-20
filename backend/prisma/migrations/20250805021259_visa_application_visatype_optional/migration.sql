-- DropForeignKey
ALTER TABLE "VisaApplication" DROP CONSTRAINT "VisaApplication_visaTypeId_fkey";

-- AlterTable
ALTER TABLE "VisaApplication" ALTER COLUMN "visaTypeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
