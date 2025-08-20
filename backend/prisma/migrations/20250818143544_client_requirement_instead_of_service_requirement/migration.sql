/*
  Warnings:

  - The values [paid] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [submitted,used] on the enum `VisaApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `ServiceRequirement` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('draft', 'personal_data_verification', 'payment_pending', 'submitted', 'completed', 'cancelled');
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VisaApplicationStatus_new" AS ENUM ('pending', 'approved', 'cancelled', 'denied');
ALTER TABLE "VisaApplication" ALTER COLUMN "status" TYPE "VisaApplicationStatus_new" USING ("status"::text::"VisaApplicationStatus_new");
ALTER TYPE "VisaApplicationStatus" RENAME TO "VisaApplicationStatus_old";
ALTER TYPE "VisaApplicationStatus_new" RENAME TO "VisaApplicationStatus";
DROP TYPE "VisaApplicationStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ServiceRequirement" DROP CONSTRAINT "ServiceRequirement_documentId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequirement" DROP CONSTRAINT "ServiceRequirement_requirementId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequirement" DROP CONSTRAINT "ServiceRequirement_reviewedById_fkey";

-- DropTable
DROP TABLE "ServiceRequirement";

-- CreateTable
CREATE TABLE "ClientRequirement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "textValue" TEXT,
    "dateValue" TIMESTAMP(3),
    "booleanValue" BOOLEAN,
    "checkpointValue" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "comment" TEXT,

    CONSTRAINT "ClientRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientRequirement_requirementId_idx" ON "ClientRequirement"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientRequirement_requirementId_key" ON "ClientRequirement"("requirementId");

-- AddForeignKey
ALTER TABLE "ClientRequirement" ADD CONSTRAINT "ClientRequirement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequirement" ADD CONSTRAINT "ClientRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientRequirement" ADD CONSTRAINT "ClientRequirement_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
