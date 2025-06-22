import { citizenshipUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCitizenshipTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  favourite: z.boolean(),
});

export const editCitizenshipTrpcRoute = citizenshipUpdateProcedure
  .input(zEditCitizenshipTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship exists
    const existingCitizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.id },
    });

    if (!existingCitizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if another citizenship with the same name exists (excluding current one)
    const duplicateCitizenship = await ctx.prisma.citizenship.findFirst({
      where: {
        name: {
          equals: input.name,
          mode: 'insensitive',
        },
        id: {
          not: input.id,
        },
      },
    });

    if (duplicateCitizenship) {
      throw new Error('Citizenship name already exists');
    }

    // Update the citizenship
    const updatedCitizenship = await ctx.prisma.citizenship.update({
      where: { id: input.id },
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
      citizenship: updatedCitizenship,
    };
  });
