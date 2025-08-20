-- CreateEnum
CREATE TYPE "RequirementApplicationScope" AS ENUM ('specific', 'country_all', 'global');

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN     "applicationScope" "RequirementApplicationScope" NOT NULL DEFAULT 'specific',
ADD COLUMN     "countryId" TEXT;

-- CreateIndex
CREATE INDEX "Requirement_applicationScope_idx" ON "Requirement"("applicationScope");

-- CreateIndex
CREATE INDEX "Requirement_countryId_idx" ON "Requirement"("countryId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
