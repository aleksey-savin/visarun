import { userUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditClientTrpcInput = z.object({
  id: z.string().uuid(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  citizenshipId: z.string().uuid().optional().nullable(),
  passportExpirationDate: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? new Date(val) : null)),
  prevViolations: z.boolean().optional(),
  prevViolationsDesc: z.string().optional().nullable(),
  isOutsideTheCountry: z.boolean().optional(),
  isOutsideTheCountryAt: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val ? new Date(val) : null)),
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
            favourite: true,
            emoji: true,
            abbreviation: true,
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
      client: updatedClient,
    };
  });
