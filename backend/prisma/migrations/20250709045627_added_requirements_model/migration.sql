-- CreateEnum
CREATE TYPE "RequirementInputType" AS ENUM ('document', 'checkpoint', 'date', 'text', 'boolean');

-- CreateEnum
CREATE TYPE "RequirementOperator" AS ENUM ('eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains');

-- CreateEnum
CREATE TYPE "RequirementUnit" AS ENUM ('days', 'months', 'years');

-- CreateEnum
CREATE TYPE "ServiceEntityType" AS ENUM ('visa_application', 'visarun_order', 'document_service');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'needs_revision');

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "inputType" "RequirementInputType" NOT NULL,
    "operator" "RequirementOperator",
    "thresholdNumber" DOUBLE PRECISION,
    "thresholdDate" TIMESTAMP(3),
    "thresholdText" TEXT,
    "thresholdBool" BOOLEAN,
    "checkpointValue" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "appliesToAllCitizenships" BOOLEAN NOT NULL DEFAULT false,
    "sampleUrl" TEXT,
    "applicableServices" "ServiceEntityType"[],
    "visaTypeId" TEXT,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementCitizenship" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "citizenshipId" TEXT NOT NULL,

    CONSTRAINT "RequirementCitizenship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementDocument" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "RequirementDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementVisaType" (
    "requirementId" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,

    CONSTRAINT "RequirementVisaType_pkey" PRIMARY KEY ("requirementId","visaTypeId")
);

-- CreateTable
CREATE TABLE "RequirementVisarunRoute" (
    "requirementId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "RequirementVisarunRoute_pkey" PRIMARY KEY ("requirementId","routeId")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "requirementId" TEXT,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "tags" TEXT[],
    "comment" TEXT,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequirement" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "serviceType" "ServiceEntityType" NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'pending',
    "textValue" TEXT,
    "dateValue" TIMESTAMP(3),
    "booleanValue" BOOLEAN,
    "checkpointValue" TEXT,
    "documentId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "comment" TEXT,

    CONSTRAINT "ServiceRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Requirement_serviceType_idx" ON "Requirement"("serviceType");

-- CreateIndex
CREATE INDEX "RequirementCitizenship_requirementId_idx" ON "RequirementCitizenship"("requirementId");

-- CreateIndex
CREATE INDEX "RequirementCitizenship_citizenshipId_idx" ON "RequirementCitizenship"("citizenshipId");

-- CreateIndex
CREATE INDEX "RequirementDocument_requirementId_idx" ON "RequirementDocument"("requirementId");

-- CreateIndex
CREATE INDEX "RequirementDocument_uploadedById_idx" ON "RequirementDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "RequirementVisaType_visaTypeId_idx" ON "RequirementVisaType"("visaTypeId");

-- CreateIndex
CREATE INDEX "RequirementVisarunRoute_routeId_idx" ON "RequirementVisarunRoute"("routeId");

-- CreateIndex
CREATE INDEX "ClientDocument_clientId_idx" ON "ClientDocument"("clientId");

-- CreateIndex
CREATE INDEX "ClientDocument_requirementId_idx" ON "ClientDocument"("requirementId");

-- CreateIndex
CREATE INDEX "ServiceRequirement_serviceType_serviceId_idx" ON "ServiceRequirement"("serviceType", "serviceId");

-- CreateIndex
CREATE INDEX "ServiceRequirement_requirementId_idx" ON "ServiceRequirement"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequirement_serviceType_serviceId_requirementId_key" ON "ServiceRequirement"("serviceType", "serviceId", "requirementId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementCitizenship" ADD CONSTRAINT "RequirementCitizenship_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementCitizenship" ADD CONSTRAINT "RequirementCitizenship_citizenshipId_fkey" FOREIGN KEY ("citizenshipId") REFERENCES "Citizenship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementDocument" ADD CONSTRAINT "RequirementDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementDocument" ADD CONSTRAINT "RequirementDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementVisaType" ADD CONSTRAINT "RequirementVisaType_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementVisaType" ADD CONSTRAINT "RequirementVisaType_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementVisarunRoute" ADD CONSTRAINT "RequirementVisarunRoute_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDocument" ADD CONSTRAINT "ClientDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequirement" ADD CONSTRAINT "ServiceRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequirement" ADD CONSTRAINT "ServiceRequirement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "ClientDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequirement" ADD CONSTRAINT "ServiceRequirement_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
