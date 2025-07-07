import { userReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllClientPassportsTrpcInput = z.object({
  clientId: z.string().uuid(),
});

export const getAllClientPassportsTrpcRoute = userReadProcedure
  .input(zGetAllClientPassportsTrpcInput)
  .query(async ({ input, ctx }) => {
    const clientPassports = await ctx.prisma.clientPassport.findMany({
      where: { clientId: input.clientId },
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
      orderBy: {
        expirationDate: 'desc',
      },
    });

    return {
      clientPassports,
    };
  });
