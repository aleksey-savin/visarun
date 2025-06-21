import { exchangeRateCreateProcedure } from '../../lib/trpc.js';
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

    if (input.broadcastToTelegram) {
      // Получаем все активные каналы
      const channels = await ctx.prisma.telegramChannel.findMany({
        where: { status: 'active' },
      });

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
          `За ваш ${formatNumber(baseVndAmount)} vnd отправим ${formatNumber(baseRubFromVndRound)} ₽`,
          ``,
          `⚠️ Расписание визаранов в Камбоджу (Ford Transit, 15 мест) :`,
          `⚫️среда, суббота – за штампами`,
          `⚫️четверг – за визами на 90 дней`,
          ``,
          `Изменения в расписании!`,
          `Теперь за визами ездим по четвергам, чтобы избежать очередей на границе. Расписание поездок за штампами остается то же.`,
          ``,
          `Подробная информация <a href="https://t.me/visarunvungtau/4693">ТУТ</a>`,
          `Визаран из Нячанга и Муйне в Камбоджу <a href="https://t.me/VisarunNT">ТУТ</a>`,
          ``,
          `➡️Запись – @visarunviet`,
          ``,
          `🔴 Будьте в курсе всех новостей! Подписывайтесь:`,
          `👉 <a href="https://www.facebook.com/share/1AM8sVfu9T/?mibextid=wwXIfr">Фейсбук</a> | <a href="https://t.me/visarunvungtau">Телеграм</a> | <a href="https://www.instagram.com/visarunsaigon?igsh=dnQzZmx1bXYwd3Zx">Инстаграм</a>`,
        ].join('\n');

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
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
