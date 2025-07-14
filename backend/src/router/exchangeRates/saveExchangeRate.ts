import { exchangeRateCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const saveExchangeRateTrpcInput = z.object({
  rubToVnd: z.number().positive(),
  vndToRub: z.number().positive(),
  usdtToVnd: z.number().positive(),
  vndToUsdt: z.number().positive(),
  usdtToRub: z.number().positive(),
  rubToUsdt: z.number().positive(),
  broadcastTo: z.array(z.object({ channelId: z.string(), body: z.string() })).min(0),
});

function cleanHtmlForTelegram(inputHtml: string): string {
  const allowedTags = [
    'b',
    'strong',
    'i',
    'em',
    'u',
    'ins',
    's',
    'strike',
    'del',
    'a',
    'code',
    'pre',
  ];

  let cleaned = inputHtml;

  // Обработка пустых <p></p>
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '\n');

  // Заменим оставшиеся <p> и </p> на \n
  cleaned = cleaned
    .replace(/<p[^>]*>/gi, '') // удаляем открывающий <p>
    .replace(/<\/p>/gi, '\n'); // заменяем закрывающий на \n

  // Заменим <br>, <div>, <h[1-6]> на \n
  cleaned = cleaned.replace(/<(br|div|h[1-6])[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<\/(div|h[1-6])>/gi, '\n');

  // Удалим теги, кроме разрешённых
  cleaned = cleaned.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tagName, attrs) => {
    const tag = tagName.toLowerCase();
    if (!allowedTags.includes(tag)) return '';

    if (tag === 'a') {
      const hrefMatch = attrs.match(/\s+href\s*=\s*(['"])(.*?)\1/i);
      if (hrefMatch) {
        return `<a href="${hrefMatch[2]}">`;
      } else if (match.startsWith('</')) {
        return `</a>`;
      }
      return '';
    }

    return match.startsWith('</') ? `</${tag}>` : `<${tag}>`;
  });

  // Удалим лишние пробелы и повторяющиеся переносы
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

export const saveExchangeRateTrpcRoute = exchangeRateCreateProcedure
  .input(saveExchangeRateTrpcInput)
  .mutation(async ({ ctx, input }) => {
    // Проверяем аутентификацию и роль
    if (!ctx.user) {
      throw new Error('Authentication required');
    }
    if (
      !ctx.user.permissions.includes('global.fullAccess') &&
      !ctx.user.permissions.includes('exchangeRates.create')
    ) {
      throw new Error('Permission required: exchangeRates.create or global.fullAccess');
    }

    // Сохраняем курс в БД
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

    if (input.broadcastTo?.length > 0) {
      // Получаем все активные каналы
      const channels = await ctx.prisma.telegramChannel.findMany({
        where: { status: 'active' },
        include: {
          messageTemplate: true,
        },
      });

      channels.filter(
        channel =>
          input.broadcastTo.find(includedChannel => includedChannel.channelId == channel.id) !==
          undefined
      );

      let broadcastResult = { success: false, message: 'No broadcast attempted' };

      if (channels.length > 0) {
        // Удобная функция для форматирования чисел с разделителями
        const formatNumber = (value: number): string => {
          try {
            // Здесь мы будем форматировать по-русски, с пробелами как разделитель тысяч
            return value.toLocaleString('ru-RU');
          } catch (e) {
            console.error(`Error formatting value ${value}:`, e);
            return String(value);
          }
        };

        // Достаём дату и время создания записи
        const createdAt = new Date(exchangeRate.createdAt);
        // Форматируем время "09:00" (пример) и дату "05 июня"
        // Если нужно всегда «09:00», можно захардкодить; если нужно текущее время, то так:
        const timeString = new Intl.DateTimeFormat('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(createdAt);
        const dateString = new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: 'long',
        }).format(createdAt);

        // Рассчитываем, сколько vnd за 10 000 ₽ и сколько ₽ за 1 000 000 vnd
        const baseRub = 10000;
        const baseVnd = baseRub * exchangeRate.rubToVnd;
        const baseVndRound = Math.round(baseVnd);

        const baseVndAmount = 1000000;
        const baseRubFromVnd = baseVndAmount * exchangeRate.vndToRub;
        const baseRubFromVndRound = Math.round(baseRubFromVnd);

        // Составляем сообщение по нужному шаблону
        const messageText = [
          `🔴Курс валют, актуальный на ${timeString} на ${dateString} :`,
          ``,
          `За ваши ${formatNumber(baseRub)} ₽ отправим ${formatNumber(baseVndRound)} vnd,`,
          `За ваш ${formatNumber(baseVndAmount)} vnd отправим ${formatNumber(baseRubFromVndRound)} ₽\n\n`,
        ].join('\n');

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            const results = await Promise.allSettled(
              channels.map(async channel => {
                const messageTemplate =
                  input.broadcastTo.find(
                    includedChannel => includedChannel.channelId === channel.id
                  )?.body || '';

                console.log(cleanHtmlForTelegram(messageTemplate));

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
                        text: messageText.concat(cleanHtmlForTelegram(messageTemplate)),
                        parse_mode: 'HTML', // или 'HTML', если нужны какие-то стили
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
                    error instanceof Error ? error.stack : 'Unknown error'
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
