-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'login';

-- AlterTable
ALTER TABLE "VisaApplication" ALTER COLUMN "applicationCode" DROP NOT NULL;
