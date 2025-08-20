-- DropForeignKey
ALTER TABLE "ClientPassport" DROP CONSTRAINT "ClientPassport_clientId_fkey";

-- DropIndex
DROP INDEX "ClientPassport_clientId_idx";

-- DropTable
DROP TABLE "ClientPassport";
