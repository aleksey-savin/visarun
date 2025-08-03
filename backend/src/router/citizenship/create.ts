import { citizenshipCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCitizenshipTrpcInput = z.object({
  name: z.string().min(1).max(100),
  emoji: z.string().min(1).max(10),
  abbreviation: z.string().min(2).max(3),
  favourite: z.boolean().default(false),
});

export const createCitizenshipTrpcRoute = citizenshipCreateProcedure
  .input(zCreateCitizenshipTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');
    const normalizedInputAbbreviation = input.abbreviation.toUpperCase().trim();

    // Get all existing citizenships to check for normalized duplicates
    const existingCitizenships = await ctx.prisma.citizenship.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
      },
    });

    // Check if a citizenship with the same normalized name already exists
    const isDuplicateName = existingCitizenships.some(citizenship => {
      const normalizedExistingName = citizenship.name.toLowerCase().trim().replace(/\s+/g, '');
      return normalizedExistingName === normalizedInputName;
    });

    if (isDuplicateName) {
      throw new Error(
        'A citizenship with this name already exists (case and spacing variations ignored)'
      );
    }

    // Check if a citizenship with the same abbreviation already exists
    const isDuplicateAbbreviation = existingCitizenships.some(citizenship => {
      return citizenship.abbreviation.toUpperCase() === normalizedInputAbbreviation;
    });

    if (isDuplicateAbbreviation) {
      throw new Error('A citizenship with this abbreviation already exists');
    }

    // Create the citizenship with original name (preserve formatting)
    const newCitizenship = await ctx.prisma.citizenship.create({
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
      citizenship: newCitizenship,
    };
  });
