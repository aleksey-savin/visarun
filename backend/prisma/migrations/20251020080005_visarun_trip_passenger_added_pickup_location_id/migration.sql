-- AlterTable
ALTER TABLE "public"."VisarunPassenger" ADD COLUMN     "pickupLocationId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "public"."PickupLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
