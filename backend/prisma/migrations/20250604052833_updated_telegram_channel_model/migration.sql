/*
  Warnings:

  - The `status` column on the `TelegramChannel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "TelegramChannelStatus" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "TelegramChannel" DROP COLUMN "status",
ADD COLUMN     "status" "TelegramChannelStatus" NOT NULL DEFAULT 'active';
