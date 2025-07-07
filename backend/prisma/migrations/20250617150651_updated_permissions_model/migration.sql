/*
  Warnings:

  - You are about to drop the column `createdById` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `Permission` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_updatedById_fkey";

-- AlterTable
ALTER TABLE "Permission" DROP COLUMN "createdById",
DROP COLUMN "updatedById";
