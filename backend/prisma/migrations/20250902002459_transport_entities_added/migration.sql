-- CreateEnum
CREATE TYPE "RouteStopType" AS ENUM ('departure', 'intermediate', 'arrival');

-- CreateEnum
CREATE TYPE "PickupMode" AS ENUM ('location', 'address', 'none');

-- CreateTable
CREATE TABLE "TransportType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TransportType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transport" (
    "id" TEXT NOT NULL,
    "transportTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seatCount" INTEGER,

    CONSTRAINT "Transport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "SeatClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunSeatPrice" (
    "id" TEXT NOT NULL,
    "seatClassId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "VisarunSeatPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunRoute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VisarunRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunRouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "stopOrder" INTEGER NOT NULL,
    "stopType" "RouteStopType" NOT NULL,
    "pickupMode" "PickupMode" NOT NULL,
    "arrivalTime" TEXT,
    "departureTime" TEXT,
    "duration" INTEGER,

    CONSTRAINT "VisarunRouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "coordinates" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPickupAddress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "routeStopId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "pickupTime" TEXT,

    CONSTRAINT "OrderPickupAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisarunStopPickupLocation" (
    "id" TEXT NOT NULL,
    "routeStopId" TEXT NOT NULL,
    "pickupLocationId" TEXT NOT NULL,
    "pickupTime" TEXT,

    CONSTRAINT "VisarunStopPickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportType_name_key" ON "TransportType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transport_name_key" ON "Transport"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SeatClass_name_key" ON "SeatClass"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VisarunRouteStop_routeId_stopOrder_key" ON "VisarunRouteStop"("routeId", "stopOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VisarunRouteStop_routeId_cityId_key" ON "VisarunRouteStop"("routeId", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "VisarunStopPickupLocation_routeStopId_pickupLocationId_key" ON "VisarunStopPickupLocation"("routeStopId", "pickupLocationId");

-- AddForeignKey
ALTER TABLE "Transport" ADD CONSTRAINT "Transport_transportTypeId_fkey" FOREIGN KEY ("transportTypeId") REFERENCES "TransportType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunSeatPrice" ADD CONSTRAINT "VisarunSeatPrice_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VisarunRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunRouteStop" ADD CONSTRAINT "VisarunRouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "VisarunRoute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunRouteStop" ADD CONSTRAINT "VisarunRouteStop_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupLocation" ADD CONSTRAINT "PickupLocation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPickupAddress" ADD CONSTRAINT "OrderPickupAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunStopPickupLocation" ADD CONSTRAINT "VisarunStopPickupLocation_routeStopId_fkey" FOREIGN KEY ("routeStopId") REFERENCES "VisarunRouteStop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisarunStopPickupLocation" ADD CONSTRAINT "VisarunStopPickupLocation_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
