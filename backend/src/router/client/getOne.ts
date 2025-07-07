import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientTrpcRoute = userReadProcedure
  .input(zGetClientTrpcInput)
  .query(async ({ input, ctx }) => {
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.id },
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

    if (!client) {
      throw new Error('Client not found');
    }

    return {
      client,
    };
  });
