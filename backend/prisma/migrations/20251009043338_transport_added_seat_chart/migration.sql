-- CreateTable
CREATE TABLE "public"."TransportSeatingChart" (
    "id" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportSeatingChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransportSeatingFloor" (
    "id" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "TransportSeatingFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransportSeatingRow" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rowLabel" TEXT,

    CONSTRAINT "TransportSeatingRow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TransportSeat" (
    "id" TEXT NOT NULL,
    "rowId" TEXT NOT NULL,
    "seatLabel" TEXT NOT NULL,
    "seatClassId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isAisle" BOOLEAN NOT NULL DEFAULT false,
    "isWindow" BOOLEAN NOT NULL DEFAULT false,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "driverSeat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TransportSeat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportSeatingChart_transportId_key" ON "public"."TransportSeatingChart"("transportId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportSeatingFloor_chartId_floorNumber_key" ON "public"."TransportSeatingFloor"("chartId", "floorNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TransportSeatingRow_floorId_rowNumber_key" ON "public"."TransportSeatingRow"("floorId", "rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TransportSeat_rowId_seatLabel_key" ON "public"."TransportSeat"("rowId", "seatLabel");

-- AddForeignKey
ALTER TABLE "public"."TransportSeatingChart" ADD CONSTRAINT "TransportSeatingChart_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "public"."Transport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportSeatingFloor" ADD CONSTRAINT "TransportSeatingFloor_chartId_fkey" FOREIGN KEY ("chartId") REFERENCES "public"."TransportSeatingChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportSeatingRow" ADD CONSTRAINT "TransportSeatingRow_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."TransportSeatingFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportSeat" ADD CONSTRAINT "TransportSeat_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "public"."TransportSeatingRow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransportSeat" ADD CONSTRAINT "TransportSeat_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "public"."SeatClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
