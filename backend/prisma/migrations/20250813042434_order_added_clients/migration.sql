-- CreateTable
CREATE TABLE "OrderClient" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "OrderClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderClient_orderId_idx" ON "OrderClient"("orderId");

-- CreateIndex
CREATE INDEX "OrderClient_clientId_idx" ON "OrderClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderClient_orderId_clientId_key" ON "OrderClient"("orderId", "clientId");

-- AddForeignKey
ALTER TABLE "OrderClient" ADD CONSTRAINT "OrderClient_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderClient" ADD CONSTRAINT "OrderClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
