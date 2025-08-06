import { countryCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateCountryTrpcInput = z.object({
  name: z.string().min(1).max(100),
  favourite: z.boolean().default(false),
  eVisaAvailable: z.boolean().default(false),
  multivisaAvailable: z.boolean().default(false),
  multivisaIsGlobal: z.boolean().optional(),
  multivisaGlobalExtraCost: z.number().min(0).optional(),
});

export const createCountryTrpcRoute = countryCreateProcedure
  .input(zCreateCountryTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing countries to check for normalized duplicates
    const existingCountries = await ctx.prisma.country.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Check if a country with the same normalized name already exists
    const isDuplicate = existingCountries.some(country => {
      const normalizedExistingName = country.name.toLowerCase().trim().replace(/\s+/g, '');
      return normalizedExistingName === normalizedInputName;
    });

    if (isDuplicate) {
      throw new Error(
        'A country with this name already exists (case and spacing variations ignored)'
      );
    }

    // Validate multivisa global settings
    if (input.multivisaIsGlobal && !input.multivisaAvailable) {
      throw new Error('Cannot enable global multivisa when multivisa is not available');
    }

    if (input.multivisaIsGlobal && input.multivisaGlobalExtraCost === undefined) {
      throw new Error('Global multivisa extra cost is required when global multivisa is enabled');
    }

    // Prepare create data
    const createData: {
      name: string;
      favourite: boolean;
      eVisaAvailable: boolean;
      multivisaAvailable: boolean;
      multivisaIsGlobal?: boolean;
      multivisaGlobalExtraCost?: number | null;
    } = {
      name: input.name,
      favourite: input.favourite,
      eVisaAvailable: input.eVisaAvailable,
      multivisaAvailable: input.multivisaAvailable,
    };

    // Handle multivisa global settings
    if (input.multivisaAvailable) {
      createData.multivisaIsGlobal = input.multivisaIsGlobal || false;
      createData.multivisaGlobalExtraCost = input.multivisaIsGlobal
        ? input.multivisaGlobalExtraCost || null
        : null;
    } else {
      createData.multivisaIsGlobal = false;
      createData.multivisaGlobalExtraCost = null;
    }

    // Create the country
    const newCountry = await ctx.prisma.country.create({
      data: createData,
      select: {
        id: true,
        name: true,
        favourite: true,
        eVisaAvailable: true,
        multivisaAvailable: true,
        multivisaIsGlobal: true,
        multivisaGlobalExtraCost: true,
      },
    });

    return {
      country: newCountry,
    };
  });
