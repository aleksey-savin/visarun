/*
  Warnings:

  - The values [inactive] on the enum `TelegramChannelStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `TelegramChannel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TelegramChannelStatus_new" AS ENUM ('active', 'blocked', 'kicked', 'insufficient_permissions');
ALTER TABLE "TelegramChannel" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TelegramChannel" ALTER COLUMN "status" TYPE "TelegramChannelStatus_new" USING ("status"::text::"TelegramChannelStatus_new");
ALTER TYPE "TelegramChannelStatus" RENAME TO "TelegramChannelStatus_old";
ALTER TYPE "TelegramChannelStatus_new" RENAME TO "TelegramChannelStatus";
DROP TYPE "TelegramChannelStatus_old";
ALTER TABLE "TelegramChannel" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "TelegramChannel" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
