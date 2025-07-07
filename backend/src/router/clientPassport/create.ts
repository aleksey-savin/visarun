import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientPassportTrpcInput = z.object({
  clientId: z.string().uuid(),
  expirationDate: z.string().transform(str => new Date(str)),
  scanPath: z.string().min(1),
});

export const createClientPassportTrpcRoute = userCreateProcedure
  .input(zCreateClientPassportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if client exists
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Create client passport
    const clientPassport = await ctx.prisma.clientPassport.create({
      data: {
        clientId: input.clientId,
        expirationDate: input.expirationDate,
        scanPath: input.scanPath,
      },
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

    return {
      clientPassport,
    };
  });
