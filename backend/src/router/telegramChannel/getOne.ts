import { z } from 'zod';
import { trpc } from '../../lib/trpc.js';

export const getTelegramChannelTrpcRoute = trpc.procedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const channel = await ctx.prisma.telegramChannel.findUnique({
      where: { id: input.id },
    });
    if (!channel) {
      throw new Error(`Telegram channel or group ${input.id} not found`);
    }
    return { channel };
  });
