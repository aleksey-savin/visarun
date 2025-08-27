/*
  Warnings:

  - The values [pending] on the enum `VisaApplicationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VisaApplicationStatus_new" AS ENUM ('pending_submit', 'awaiting_approval', 'recieved_stamp_request', 'approved', 'pending_refund', 'refunded', 'denied', 'cancelled');
ALTER TABLE "VisaApplication" ALTER COLUMN "status" TYPE "VisaApplicationStatus_new" USING ("status"::text::"VisaApplicationStatus_new");
ALTER TYPE "VisaApplicationStatus" RENAME TO "VisaApplicationStatus_old";
ALTER TYPE "VisaApplicationStatus_new" RENAME TO "VisaApplicationStatus";
DROP TYPE "VisaApplicationStatus_old";
COMMIT;
