-- Rename table
ALTER TABLE "VisaNationalitySurcharge" RENAME TO "VisaCitizenshipSurcharge";

-- Rename constraints
ALTER TABLE "VisaCitizenshipSurcharge" RENAME CONSTRAINT "VisaNationalitySurcharge_pkey" TO "VisaCitizenshipSurcharge_pkey";
ALTER TABLE "VisaCitizenshipSurcharge" RENAME CONSTRAINT "VisaNationalitySurcharge_citizenshipId_fkey" TO "VisaCitizenshipSurcharge_citizenshipId_fkey";