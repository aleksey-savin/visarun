import { citizenshipCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCitizenshipTrpcInput = z.object({
  name: z.string().min(1).max(100),
  favourite: z.boolean().default(false),
});

export const createCitizenshipTrpcRoute = citizenshipCreateProcedure
  .input(zCreateCitizenshipTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship name already exists
    const existingCitizenship = await ctx.prisma.citizenship.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCitizenship) {
      throw new Error('Citizenship name already exists');
    }

    // Create the citizenship
    const newCitizenship = await ctx.prisma.citizenship.create({
      data: {
        name: input.name,
        favourite: input.favourite,
      },
      select: {
        id: true,
        name: true,
        favourite: true,
      },
    });

    return {
      citizenship: newCitizenship,
    };
  });
