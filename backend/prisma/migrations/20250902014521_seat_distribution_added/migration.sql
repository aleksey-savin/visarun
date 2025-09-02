-- CreateTable
CREATE TABLE "TransportSeatDistribution" (
    "id" TEXT NOT NULL,
    "transportId" TEXT NOT NULL,
    "seatClassId" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportSeatDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransportSeatDistribution_transportId_seatClassId_key" ON "TransportSeatDistribution"("transportId", "seatClassId");

-- AddForeignKey
ALTER TABLE "TransportSeatDistribution" ADD CONSTRAINT "TransportSeatDistribution_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "Transport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportSeatDistribution" ADD CONSTRAINT "TransportSeatDistribution_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "SeatClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
