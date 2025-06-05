import { adminProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const saveExchangeRateTrpcInput = z.object({
  rubToVnd: z.number().positive(),
  vndToRub: z.number().positive(),
  usdtToVnd: z.number().positive(),
  vndToUsdt: z.number().positive(),
  usdtToRub: z.number().positive(),
  rubToUsdt: z.number().positive(),
  broadcastToTelegram: z.boolean().default(false),
});

export const saveExchangeRateTrpcRoute = adminProcedure
  .input(saveExchangeRateTrpcInput)
  .mutation(async ({ ctx, input }) => {
    // Ensure user is authenticated and is admin or manager
    if (!ctx.user) {
      throw new Error('Authentication required');
    }

    if (ctx.user.role !== 'admin') {
      throw new Error('Not authorized');
    }

    const exchangeRate = await ctx.prisma.exchangeRate.create({
      data: {
        rubToVnd: input.rubToVnd,
        vndToRub: input.vndToRub,
        usdtToVnd: input.usdtToVnd,
        vndToUsdt: input.vndToUsdt,
        usdtToRub: input.usdtToRub,
        rubToUsdt: input.rubToUsdt,
        userId: ctx.user.id,
      },
    });

    if (input.broadcastToTelegram) {
      // After saving, broadcast to all active Telegram channels
      // Get all active telegram channels
      const channels = await ctx.prisma.telegramChannel.findMany({
        where: { status: 'active' },
      });

      let broadcastResult = { success: false, message: 'No broadcast attempted' };

      if (channels.length > 0) {
        // Helper function to safely format numbers
        const formatNumber = (value: number, decimals: number): string => {
          try {
            return value.toFixed(decimals);
          } catch (e) {
            console.error(`Error formatting value ${value}:`, e);
            return String(value);
          }
        };

        // Format the rates with safe number formatting
        const formattedRates = [
          `RUB/VND: ${formatNumber(exchangeRate.rubToVnd, 2)}`,
          `VND/RUB: ${formatNumber(exchangeRate.vndToRub, 4)}`,
          `USDT/VND: ${formatNumber(exchangeRate.usdtToVnd, 0)}`,
          `VND/USDT: ${formatNumber(exchangeRate.vndToUsdt, 6)}`,
          `USDT/RUB: ${formatNumber(exchangeRate.usdtToRub, 2)}`,
          `RUB/USDT: ${formatNumber(exchangeRate.rubToUsdt, 4)}`,
        ].join('\n');

        // Create message text
        const dateString = new Date(exchangeRate.createdAt).toLocaleString();
        const messageText = `Exchange rates updated (${dateString}):\n\n${formattedRates}`;

        // Check for bot token
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            // Send message to each channel
            const results = await Promise.allSettled(
              channels.map(async channel => {
                try {
                  const response = await fetch(
                    `https://api.telegram.org/bot${botToken}/sendMessage`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        chat_id: channel.chatId,
                        text: messageText,
                      }),
                    }
                  );

                  return {
                    channelId: channel.chatId,
                    channelTitle: channel.chatTitle,
                    success: response.ok,
                  };
                } catch (error: unknown) {
                  console.error(
                    `Error sending to channel ${channel.chatTitle}:`,
                    error instanceof Error ? error.message : 'Unknown error'
                  );
                  return {
                    channelId: channel.chatId,
                    channelTitle: channel.chatTitle,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    response: null,
                  };
                }
              })
            );

            // Count successful and failed broadcasts
            const successful = results.filter(
              r => r.status === 'fulfilled' && r.value.success
            ).length;
            const failed = channels.length - successful;

            broadcastResult = {
              success: true,
              message: `Exchange rates broadcast: ${successful} successful, ${failed} failed`,
            };
          } catch (error: unknown) {
            console.error('Error broadcasting exchange rates:', error);
            broadcastResult = {
              success: false,
              message: `Error broadcasting rates: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
          }
        } else {
          broadcastResult = {
            success: false,
            message: 'TELEGRAM_BOT_TOKEN not set in environment variables',
          };
        }
      }

      return {
        exchangeRate,
        broadcastResult,
      };
    }
    return {
      exchangeRate,
      broadcastResult: {
        success: false,
        message: 'Broadcasting to Telegram for current exchange rates was disabled',
      },
    };
  });
