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

    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing citizenships to check for normalized duplicates (excluding current one)
    const existingCitizenships = await ctx.prisma.citizenship.findMany({
      where: {
        id: {
          not: input.id,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Check if a citizenship with the same normalized name already exists
    const isDuplicate = existingCitizenships.some(citizenship => {
      const normalizedExistingName = citizenship.name.toLowerCase().trim().replace(/\s+/g, '');
      return normalizedExistingName === normalizedInputName;
    });

    if (isDuplicate) {
      throw new Error(
        'A citizenship with this name already exists (case and spacing variations ignored)'
      );
    }

    // Update the citizenship with original name (preserve formatting)
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
