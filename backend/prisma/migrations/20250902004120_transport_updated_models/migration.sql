-- AddForeignKey
ALTER TABLE "VisarunSeatPrice" ADD CONSTRAINT "VisarunSeatPrice_seatClassId_fkey" FOREIGN KEY ("seatClassId") REFERENCES "SeatClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
