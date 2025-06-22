import { trpc } from '../../lib/trpc.js';

export const getAllContactMethodsTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const contactMethods = await ctx.prisma.contactMethod.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  return { contactMethods };
});
