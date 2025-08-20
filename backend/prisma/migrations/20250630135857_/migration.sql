-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'submitted', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('visa', 'visarun');

-- CreateEnum
CREATE TYPE "DiscountAppliedType" AS ENUM ('manual', 'rule');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percent', 'fixed');

-- CreateEnum
CREATE TYPE "AppliesToService" AS ENUM ('visa', 'visarun', 'all');

-- CreateEnum
CREATE TYPE "VisaApplicationStatus" AS ENUM ('pending', 'submitted', 'approved', 'used', 'cancelled', 'denied');

-- CreateEnum
CREATE TYPE "ProcessingMode" AS ENUM ('fixed', 'approximate');

-- CreateEnum
CREATE TYPE "ProcessingUnit" AS ENUM ('hours', 'days');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "OrderStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceTypeId" TEXT NOT NULL,
    "discountAppliedType" "DiscountAppliedType",
    "discountRuleId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "discountComment" TEXT,
    "note" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "finalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDiscountRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "appliesToService" "AppliesToService" NOT NULL,
    "appliesAutomatically" BOOLEAN NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "minOrders" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "note" TEXT,

    CONSTRAINT "ClientDiscountRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDiscountAssignment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,

    CONSTRAINT "ClientDiscountAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceCost" DOUBLE PRECISION NOT NULL,
    "countryId" TEXT NOT NULL,
    "isMultientry" BOOLEAN NOT NULL,
    "multientryExtraCost" DOUBLE PRECISION,
    "processingMode" "ProcessingMode" NOT NULL,
    "processingUnit" "ProcessingUnit" NOT NULL,
    "processingValueFixed" INTEGER,
    "processingValueMin" INTEGER,
    "processingValueMax" INTEGER,
    "submissionDayIncluded" BOOLEAN NOT NULL,

    CONSTRAINT "VisaType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisaApplication" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "submittedByAgent" BOOLEAN NOT NULL,
    "countryId" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,
    "note" TEXT,
    "revisedActivationDate" TIMESTAMP(3),
    "statusNote" TEXT,
    "status" "VisaApplicationStatus" NOT NULL,

    CONSTRAINT "VisaApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientVisa" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "visaTypeId" TEXT NOT NULL,
    "visaApplicationId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "notifiedExpiry" BOOLEAN NOT NULL,

    CONSTRAINT "ClientVisa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_clientId_idx" ON "OrderItem"("clientId");

-- CreateIndex
CREATE INDEX "OrderItem_discountRuleId_idx" ON "OrderItem"("discountRuleId");

-- CreateIndex
CREATE INDEX "ClientDiscountAssignment_clientId_idx" ON "ClientDiscountAssignment"("clientId");

-- CreateIndex
CREATE INDEX "ClientDiscountAssignment_ruleId_idx" ON "ClientDiscountAssignment"("ruleId");

-- CreateIndex
CREATE INDEX "ClientDiscountAssignment_assignedByUserId_idx" ON "ClientDiscountAssignment"("assignedByUserId");

-- CreateIndex
CREATE INDEX "ClientVisa_clientId_idx" ON "ClientVisa"("clientId");

-- CreateIndex
CREATE INDEX "ClientVisa_countryId_idx" ON "ClientVisa"("countryId");

-- CreateIndex
CREATE INDEX "ClientVisa_visaTypeId_idx" ON "ClientVisa"("visaTypeId");

-- CreateIndex
CREATE INDEX "ClientVisa_visaApplicationId_idx" ON "ClientVisa"("visaApplicationId");

-- AddForeignKey
ALTER TABLE "VisaCitizenshipSurcharge" ADD CONSTRAINT "VisaCitizenshipSurcharge_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_discountRuleId_fkey" FOREIGN KEY ("discountRuleId") REFERENCES "ClientDiscountRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiscountAssignment" ADD CONSTRAINT "ClientDiscountAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiscountAssignment" ADD CONSTRAINT "ClientDiscountAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDiscountAssignment" ADD CONSTRAINT "ClientDiscountAssignment_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "ClientDiscountRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaType" ADD CONSTRAINT "VisaType_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisaApplication" ADD CONSTRAINT "VisaApplication_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientVisa" ADD CONSTRAINT "ClientVisa_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientVisa" ADD CONSTRAINT "ClientVisa_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientVisa" ADD CONSTRAINT "ClientVisa_visaApplicationId_fkey" FOREIGN KEY ("visaApplicationId") REFERENCES "VisaApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientVisa" ADD CONSTRAINT "ClientVisa_visaTypeId_fkey" FOREIGN KEY ("visaTypeId") REFERENCES "VisaType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
