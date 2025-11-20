/*
  Warnings:

  - You are about to drop the column `entityId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Comment` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Comment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Comment" DROP COLUMN "entityId",
DROP COLUMN "entityType",
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "orderItemId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "public"."OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
