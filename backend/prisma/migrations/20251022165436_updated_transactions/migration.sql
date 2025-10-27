/*
  Warnings:

  - The values [in_progress,finished] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TransactionStatus_new" AS ENUM ('draft', 'details_sended', 'check_uploaded', 'paid_uninformed', 'paid_informed', 'complited', 'cancelled');
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" TYPE "public"."TransactionStatus_new" USING ("status"::text::"public"."TransactionStatus_new");
ALTER TYPE "public"."TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "public"."TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" SET DEFAULT 'draft';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "isCompanyTransaction" BOOLEAN NOT NULL DEFAULT true;
