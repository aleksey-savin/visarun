import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllClientsByUserIdTrpcInput = z.object({
  userId: z.string().uuid(),
});

export const getAllClientsByUserIdTrpcRoute = userReadProcedure
  .input(zGetAllClientsByUserIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const clients = await ctx.prisma.client.findMany({
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
      orderBy: {
        firstName: 'asc',
      },
    });

    return {
      clients,
    };
  });
