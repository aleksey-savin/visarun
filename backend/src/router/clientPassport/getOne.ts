import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientPassportTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientPassportTrpcRoute = userReadProcedure
  .input(zGetClientPassportTrpcInput)
  .query(async ({ input, ctx }) => {
    const clientPassport = await ctx.prisma.clientPassport.findUnique({
      where: { id: input.id },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                email: true,
              },
            },
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!clientPassport) {
      throw new Error('Client passport not found');
    }

    return {
      clientPassport,
    };
  });
