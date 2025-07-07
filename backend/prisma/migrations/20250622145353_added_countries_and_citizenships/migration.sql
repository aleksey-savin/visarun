-- CreateTable
CREATE TABLE "Citizenship" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "favourite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Citizenship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eVisaAvailable" BOOLEAN NOT NULL DEFAULT false,
    "multivisaAvailable" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaFree" (
    "citizenshipId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "stampDuration" INTEGER NOT NULL,

    CONSTRAINT "VisaFree_pkey" PRIMARY KEY ("citizenshipId","countryId")
);

-- CreateTable
CREATE TABLE "Blacklisted" (
    "citizenshipId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "Blacklisted_pkey" PRIMARY KEY ("citizenshipId","countryId")
);

-- CreateTable
CREATE TABLE "VisaNationalitySurcharge" (
    "id" TEXT NOT NULL,
    "citizenshipId" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,
    "surchargeAmount" DOUBLE PRECISION NOT NULL,
    "note" TEXT,

    CONSTRAINT "VisaNationalitySurcharge_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaFree" ADD CONSTRAINT "VisaFree_citizenshipId_fkey" FOREIGN KEY ("citizenshipId") REFERENCES "Citizenship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaFree" ADD CONSTRAINT "VisaFree_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blacklisted" ADD CONSTRAINT "Blacklisted_citizenshipId_fkey" FOREIGN KEY ("citizenshipId") REFERENCES "Citizenship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blacklisted" ADD CONSTRAINT "Blacklisted_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaNationalitySurcharge" ADD CONSTRAINT "VisaNationalitySurcharge_citizenshipId_fkey" FOREIGN KEY ("citizenshipId") REFERENCES "Citizenship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
