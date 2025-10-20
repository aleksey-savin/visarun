-- DropForeignKey
ALTER TABLE "public"."OrderPayment" DROP CONSTRAINT "OrderPayment_currencyId_fkey";

-- AlterTable
ALTER TABLE "public"."OrderPayment" ALTER COLUMN "amount" DROP NOT NULL,
ALTER COLUMN "currencyId" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "amountInSelectedCurrency" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."OrderPayment" ADD CONSTRAINT "OrderPayment_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "public"."currencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
