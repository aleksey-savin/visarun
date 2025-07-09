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
        documents: {
          orderBy: {
            uploadedAt: 'desc',
          },
          include: {
            requirement: {
              select: {
                id: true,
                title: true,
                description: true,
                serviceType: true,
                inputType: true,
              },
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      client,
    };
  });
