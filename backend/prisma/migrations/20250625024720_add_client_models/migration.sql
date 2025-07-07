-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenshipId" TEXT,
    "prevViolations" BOOLEAN NOT NULL DEFAULT false,
    "prevViolationsDesc" TEXT,
    "isOutsideTheCountry" BOOLEAN NOT NULL DEFAULT false,
    "isOutsideTheCountryAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPassport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "scanPath" TEXT NOT NULL,

    CONSTRAINT "ClientPassport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_citizenshipId_idx" ON "Client"("citizenshipId");

-- CreateIndex
CREATE INDEX "ClientPassport_clientId_idx" ON "ClientPassport"("clientId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_citizenshipId_fkey" FOREIGN KEY ("citizenshipId") REFERENCES "Citizenship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPassport" ADD CONSTRAINT "ClientPassport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
