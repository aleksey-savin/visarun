import { userCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateClientTrpcInput = z.object({
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  citizenshipId: z.string().uuid().optional(),
  prevViolations: z.boolean().default(false),
  prevViolationsDesc: z.string().optional(),
  isOutsideTheCountry: z.boolean().default(false),
  isOutsideTheCountryAt: z.date().optional(),
});

export const createClientTrpcRoute = userCreateProcedure
  .input(zCreateClientTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if user exists
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
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

    // Create client
    const client = await ctx.prisma.client.create({
      data: {
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        citizenshipId: input.citizenshipId,
        prevViolations: input.prevViolations,
        prevViolationsDesc: input.prevViolationsDesc,
        isOutsideTheCountry: input.isOutsideTheCountry,
        isOutsideTheCountryAt: input.isOutsideTheCountryAt,
      },
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
        passports: true,
      },
    });

    return {
      client,
    };
  });
