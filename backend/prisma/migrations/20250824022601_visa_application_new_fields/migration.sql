-- AlterTable
ALTER TABLE "VisaApplication" ADD COLUMN     "clientIsInTheCountry" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plannedCompletionDate" TIMESTAMP(3),
ADD COLUMN     "plannedCountryExitDate" TIMESTAMP(3),
ADD COLUMN     "stampUntil" TIMESTAMP(3);
