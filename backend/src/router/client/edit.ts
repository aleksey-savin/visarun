import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientTrpcInput = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  citizenshipId: z.string().uuid().optional().nullable(),
  prevViolations: z.boolean().optional(),
  prevViolationsDesc: z.string().optional().nullable(),
  isOutsideTheCountry: z.boolean().optional(),
  isOutsideTheCountryAt: z.date().optional().nullable(),
});

export const editClientTrpcRoute = userUpdateProcedure
  .input(zEditClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    // Check if client exists
    const existingClient = await ctx.prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Check if citizenship exists if provided
    if (input.citizenshipId) {
      const citizenship = await ctx.prisma.citizenship.findUnique({
        where: { id: input.citizenshipId },
      });

      if (!citizenship) {
        throw new Error('Citizenship not found');
      }
    }

    // Update client
    const updatedClient = await ctx.prisma.client.update({
      where: { id },
      data: updateData,
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
      client: updatedClient,
    };
  });
