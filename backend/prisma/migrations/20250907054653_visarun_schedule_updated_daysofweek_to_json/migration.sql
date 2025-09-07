/*
  Warnings:

  - Changed the type of `daysOfWeek` on the `VisarunSchedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "VisarunSchedule" DROP COLUMN "daysOfWeek",
ADD COLUMN     "daysOfWeek" JSONB NOT NULL;
