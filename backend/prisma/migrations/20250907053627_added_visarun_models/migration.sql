/*
  Warnings:

  - You are about to drop the column `duration` on the `VisarunRouteStop` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "VisarunServiceType" AS ENUM ('stamp', 'visa');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'in_process', 'completed');

-- CreateEnum
CREATE TYPE "PassengerStatus" AS ENUM ('confirmed', 'checked_in', 'no_show', 'cancelled');

-- AlterTable
ALTER TABLE "VisarunRoute" ADD COLUMN     "stamp" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "visarun" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VisarunRouteStop" DROP COLUMN "duration",
ADD COLUMN     "arrivalNextDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "waitingDuration" INTEGER;

-- CreateTable
CREATE TABLE "VisarunRouteTransport" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisarunRouteTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunSchedule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysOfWeek" INTEGER NOT NULL,
    "departureTime" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "autoGeneratePeriodMonths" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "VisarunSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunTrip" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "routeId" TEXT NOT NULL,
    "departureDateTime" TIMESTAMP(3) NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "notes" TEXT,
    "cancelReason" TEXT,
    "isFromSchedule" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisarunTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunTripTransport" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisarunTripTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunPassenger" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "tripTransportId" TEXT,
    "clientId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "serviceType" "VisarunServiceType" NOT NULL,
    "seatNumber" TEXT,
    "seatClass" TEXT,
    "pickupAddress" TEXT,
    "pickupTime" TEXT,
    "routeStopId" TEXT,
    "status" "PassengerStatus" NOT NULL DEFAULT 'confirmed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisarunPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VisarunRouteTransport_routeId_idx" ON "VisarunRouteTransport"("routeId");

-- CreateIndex
CREATE INDEX "VisarunRouteTransport_transportId_idx" ON "VisarunRouteTransport"("transportId");

-- CreateIndex
CREATE UNIQUE INDEX "VisarunRouteTransport_routeId_transportId_key" ON "VisarunRouteTransport"("routeId", "transportId");

-- CreateIndex
CREATE INDEX "VisarunSchedule_routeId_idx" ON "VisarunSchedule"("routeId");

-- CreateIndex
CREATE INDEX "VisarunSchedule_validFrom_validTo_idx" ON "VisarunSchedule"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "VisarunTrip_scheduleId_idx" ON "VisarunTrip"("scheduleId");

-- CreateIndex
CREATE INDEX "VisarunTrip_routeId_idx" ON "VisarunTrip"("routeId");

-- CreateIndex
CREATE INDEX "VisarunTrip_departureDateTime_idx" ON "VisarunTrip"("departureDateTime");

-- CreateIndex
CREATE INDEX "VisarunTrip_status_idx" ON "VisarunTrip"("status");

-- CreateIndex
CREATE INDEX "VisarunTripTransport_tripId_idx" ON "VisarunTripTransport"("tripId");

-- CreateIndex
CREATE INDEX "VisarunTripTransport_transportId_idx" ON "VisarunTripTransport"("transportId");

-- CreateIndex
CREATE INDEX "VisarunPassenger_tripId_idx" ON "VisarunPassenger"("tripId");

-- CreateIndex
CREATE INDEX "VisarunPassenger_tripTransportId_idx" ON "VisarunPassenger"("tripTransportId");

-- CreateIndex
CREATE INDEX "VisarunPassenger_clientId_idx" ON "VisarunPassenger"("clientId");

-- CreateIndex
CREATE INDEX "VisarunPassenger_orderItemId_idx" ON "VisarunPassenger"("orderItemId");

-- AddForeignKey
ALTER TABLE "VisarunRouteTransport" ADD CONSTRAINT "VisarunRouteTransport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VisarunRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunRouteTransport" ADD CONSTRAINT "VisarunRouteTransport_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "Transport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunSchedule" ADD CONSTRAINT "VisarunSchedule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VisarunRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunTrip" ADD CONSTRAINT "VisarunTrip_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "VisarunSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunTrip" ADD CONSTRAINT "VisarunTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VisarunRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunTripTransport" ADD CONSTRAINT "VisarunTripTransport_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "VisarunTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunTripTransport" ADD CONSTRAINT "VisarunTripTransport_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "Transport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "VisarunTrip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_tripTransportId_fkey" FOREIGN KEY ("tripTransportId") REFERENCES "VisarunTripTransport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunPassenger" ADD CONSTRAINT "VisarunPassenger_routeStopId_fkey" FOREIGN KEY ("routeStopId") REFERENCES "VisarunRouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
