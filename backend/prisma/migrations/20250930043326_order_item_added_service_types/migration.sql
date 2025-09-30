-- CreateEnum
CREATE TYPE "VisaApplicationType" AS ENUM ('visa', 'acceleration');

-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'acceleration';

-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "type" "VisaApplicationType" NOT NULL DEFAULT 'visa';
