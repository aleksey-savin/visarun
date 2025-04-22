import { trpc } from '../../lib/trpc.js';

export const getAllUsersTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const users = await ctx.prisma.user.findMany({
    orderBy: { firstName: 'asc' },
  });

  return { users };
});
