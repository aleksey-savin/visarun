/*
  Warnings:

  - A unique constraint covering the columns `[chatId]` on the table `TelegramChannel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TelegramChannel_chatId_key" ON "TelegramChannel"("chatId");
