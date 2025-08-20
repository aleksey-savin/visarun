-- DropForeignKey
ALTER TABLE "UserContactMethod" DROP CONSTRAINT "UserContactMethod_contactMethodId_fkey";

-- AlterTable
ALTER TABLE "UserContactMethod" ALTER COLUMN "contactMethodId" DROP NOT NULL,
ALTER COLUMN "value" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserContactMethod" ADD CONSTRAINT "UserContactMethod_contactMethodId_fkey" FOREIGN KEY ("contactMethodId") REFERENCES "ContactMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
