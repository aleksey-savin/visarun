import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientPassportTrpcInput = z.object({
  id: z.string().uuid(),
  expirationDate: z
    .string()
    .transform(str => new Date(str))
    .optional(),
  scanPath: z.string().min(1).optional(),
});

export const editClientPassportTrpcRoute = userUpdateProcedure
  .input(zEditClientPassportTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if client passport exists
    const existingClientPassport = await ctx.prisma.clientPassport.findUnique({
      where: { id },
    });

    if (!existingClientPassport) {
      throw new Error('Client passport not found');
    }

    // Update client passport
    const updatedClientPassport = await ctx.prisma.clientPassport.update({
      where: { id },
      data: updateData,
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
      clientPassport: updatedClientPassport,
    };
  });
