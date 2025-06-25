import { citizenshipCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCitizenshipTrpcInput = z.object({
  name: z.string().min(1).max(100),
  favourite: z.boolean().default(false),
});

export const createCitizenshipTrpcRoute = citizenshipCreateProcedure
  .input(zCreateCitizenshipTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing citizenships to check for normalized duplicates
    const existingCitizenships = await ctx.prisma.citizenship.findMany({
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

    // Create the citizenship with original name (preserve formatting)
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
