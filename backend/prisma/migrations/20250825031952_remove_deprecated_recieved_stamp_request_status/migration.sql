-- Migration to remove deprecated recieved_stamp_request status
-- First, update any existing records with recieved_stamp_request status to awaiting_approval
UPDATE "VisaApplication" SET "status" = 'awaiting_approval' WHERE "status" = 'recieved_stamp_request';

-- AlterEnum
-- This migration removes recieved_stamp_request from the VisaApplicationStatus enum
BEGIN;
CREATE TYPE "VisaApplicationStatus_new" AS ENUM ('pending_submit', 'awaiting_approval', 'approved', 'pending_refund', 'refunded', 'denied', 'cancelled');
ALTER TABLE "VisaApplication" ALTER COLUMN "status" TYPE "VisaApplicationStatus_new" USING ("status"::text::"VisaApplicationStatus_new");
ALTER TYPE "VisaApplicationStatus" RENAME TO "VisaApplicationStatus_old";
ALTER TYPE "VisaApplicationStatus_new" RENAME TO "VisaApplicationStatus";
DROP TYPE "VisaApplicationStatus_old";
COMMIT;
