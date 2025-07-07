import { trpc } from '../../lib/trpc.js';

export const getAllTelegramChannelsTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const channels = await ctx.prisma.telegramChannel.findMany({
    orderBy: { chatTitle: 'asc' },
  });

  return { channels };
});
