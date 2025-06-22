-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserContactMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactMethodId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactMethod_name_key" ON "ContactMethod"("name");

-- CreateIndex
CREATE INDEX "UserContactMethod_userId_idx" ON "UserContactMethod"("userId");

-- CreateIndex
CREATE INDEX "UserContactMethod_contactMethodId_idx" ON "UserContactMethod"("contactMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "UserContactMethod_userId_contactMethodId_key" ON "UserContactMethod"("userId", "contactMethodId");

-- AddForeignKey
ALTER TABLE "UserContactMethod" ADD CONSTRAINT "UserContactMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserContactMethod" ADD CONSTRAINT "UserContactMethod_contactMethodId_fkey" FOREIGN KEY ("contactMethodId") REFERENCES "ContactMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
