-- CreateEnum
CREATE TYPE "public"."VisarunTripTransportStatus" AS ENUM ('added', 'rented', 'cancelled', 'completed');

-- AlterTable
ALTER TABLE "public"."VisarunTripTransport" ADD COLUMN     "status" "public"."VisarunTripTransportStatus" NOT NULL DEFAULT 'added';
