import { citizenshipUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCitizenshipTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  emoji: z.string().min(1).max(10),
  abbreviation: z.string().min(2).max(3),
  favourite: z.boolean().default(false),
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
    const normalizedInputAbbreviation = input.abbreviation.toUpperCase().trim();

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
        abbreviation: true,
      },
    });

    // Check if a citizenship with the same normalized name already exists
    // Check if a citizenship with the same normalized name already exists (exclude current)
    const isDuplicateName = existingCitizenships.some(citizenship => {
      const normalizedExistingName = citizenship.name.toLowerCase().trim().replace(/\s+/g, '');
      return normalizedExistingName === normalizedInputName && citizenship.id !== input.id;
    });

    if (isDuplicateName) {
      throw new Error(
        'A citizenship with this name already exists (case and spacing variations ignored)'
      );
    }

    // Check if a citizenship with the same abbreviation already exists (exclude current)
    const isDuplicateAbbreviation = existingCitizenships.some(citizenship => {
      return (
        citizenship.abbreviation.toUpperCase() === normalizedInputAbbreviation &&
        citizenship.id !== input.id
      );
    });

    if (isDuplicateAbbreviation) {
      throw new Error('A citizenship with this abbreviation already exists');
    }

    // Update the citizenship with original name (preserve formatting)
    // Update the citizenship
    const updatedCitizenship = await ctx.prisma.citizenship.update({
      where: { id: input.id },
      data: {
        name: input.name,
        emoji: input.emoji,
        abbreviation: input.abbreviation.toUpperCase(),
        favourite: input.favourite,
      },
      select: {
        id: true,
        name: true,
        emoji: true,
        abbreviation: true,
        favourite: true,
      },
    });

    return {
      citizenship: updatedCitizenship,
    };
  });
