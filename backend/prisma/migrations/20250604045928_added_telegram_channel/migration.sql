-- CreateTable
CREATE TABLE "TelegramChannel" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" INTEGER NOT NULL,
    "chatTitle" TEXT NOT NULL,
    "chatUsername" TEXT NOT NULL,
    "chatType" TEXT NOT NULL,
    "fromId" INTEGER NOT NULL,
    "fromIsBot" BOOLEAN NOT NULL,
    "fromFirstName" TEXT NOT NULL,
    "fromLastName" TEXT NOT NULL,
    "fromUsername" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "TelegramChannel_pkey" PRIMARY KEY ("id")
);
