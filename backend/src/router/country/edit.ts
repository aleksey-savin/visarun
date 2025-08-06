import { countryUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditCountryTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  favourite: z.boolean().default(false),
  eVisaAvailable: z.boolean(),
  multivisaAvailable: z.boolean(),
  multivisaIsGlobal: z.boolean().optional(),
  multivisaGlobalExtraCost: z.number().min(0).optional(),
});

export const editCountryTrpcRoute = countryUpdateProcedure
  .input(zEditCountryTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if country exists
    const existingCountry = await ctx.prisma.country.findUnique({
      where: { id: input.id },
    });

    if (!existingCountry) {
      throw new Error('Country not found');
    }

    // Normalize the input name for duplicate checking
    const normalizedInputName = input.name.toLowerCase().trim().replace(/\s+/g, '');

    // Get all existing countries to check for normalized duplicates (excluding current one)
    const existingCountries = await ctx.prisma.country.findMany({
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

    // Prepare update data
    const updateData: {
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
      updateData.multivisaIsGlobal = input.multivisaIsGlobal || false;
      updateData.multivisaGlobalExtraCost = input.multivisaIsGlobal
        ? input.multivisaGlobalExtraCost || null
        : null;
    } else {
      // If multivisa is disabled, reset global settings
      updateData.multivisaIsGlobal = false;
      updateData.multivisaGlobalExtraCost = null;
    }

    // Count affected visa types for global multivisa update
    let affectedVisaTypesCount = 0;
    if (input.multivisaIsGlobal && input.multivisaGlobalExtraCost !== undefined) {
      const visaTypesCount = await ctx.prisma.visaType.count({
        where: { countryId: input.id },
      });
      affectedVisaTypesCount = visaTypesCount;
    }

    // Update the country
    const updatedCountry = await ctx.prisma.country.update({
      where: { id: input.id },
      data: updateData,
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

    // If global multivisa is enabled, update all visa types for this country
    if (input.multivisaIsGlobal && input.multivisaGlobalExtraCost !== undefined) {
      await ctx.prisma.visaType.updateMany({
        where: { countryId: input.id },
        data: {
          isMultientry: true,
          multientryExtraCost: input.multivisaGlobalExtraCost,
        },
      });
    }

    return {
      country: updatedCountry,
      affectedVisaTypesCount,
    };
  });
