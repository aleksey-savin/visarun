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
      orderBy: {
        firstName: 'asc',
      },
    });

    return {
      clients,
    };
  });
