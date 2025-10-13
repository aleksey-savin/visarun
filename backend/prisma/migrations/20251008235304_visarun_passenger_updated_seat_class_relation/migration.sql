/*
  Warnings:

  - You are about to drop the column `seatClass` on the `VisarunPassenger` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."EntityType" AS ENUM ('order', 'visaApplication');

-- AlterTable
ALTER TABLE "public"."VisarunPassenger" DROP COLUMN "seatClass",
ADD COLUMN     "seatClassId" TEXT,
ALTER COLUMN "serviceType" SET DEFAULT 'visa';

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "entityType" "public"."EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "documentUrl" TEXT,
    "userId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "public"."SeatClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
