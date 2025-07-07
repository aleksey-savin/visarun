import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getClientByUserIdTrpcRoute = userReadProcedure
  .input(zGetClientByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const client = await ctx.prisma.client.findFirst({
      where: { userId: input.userId },
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
        passports: {
          orderBy: {
            expirationDate: 'desc',
          },
        },
      },
    });

    return {
      client,
    };
  });
