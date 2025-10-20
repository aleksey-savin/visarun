-- AlterEnum
ALTER TYPE "public"."TripStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "birthDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."VisaApplication" ALTER COLUMN "clientIsInTheCountry" SET DEFAULT true;
