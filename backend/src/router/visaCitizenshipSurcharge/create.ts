import { visaCitizenshipSurchargeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaCitizenshipSurchargeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeIds: z.array(z.string().uuid()).optional(),
  isGlobal: z.boolean().default(false),
  surchargeAmount: z.number().min(0),
  note: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
});

export const createVisaCitizenshipSurchargeTrpcRoute = visaCitizenshipSurchargeCreateProcedure
  .input(zCreateVisaCitizenshipSurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship exists
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.citizenshipId },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if country exists
    const country = await ctx.prisma.country.findUnique({
      where: { id: input.countryId },
    });

    if (!country) {
      throw new Error('Country not found');
    }

    // Validate isGlobal and visaTypeIds relationship
    if (input.isGlobal && input.visaTypeIds && input.visaTypeIds.length > 0) {
      throw new Error('Cannot specify visa types when isGlobal is true');
    }

    if (!input.isGlobal && (!input.visaTypeIds || input.visaTypeIds.length === 0)) {
      throw new Error('At least one visa type must be selected when isGlobal is false');
    }

    // Get visa types based on global setting
    let finalVisaTypeIds: string[];

    if (input.isGlobal) {
      // Get all visa types for this country
      const allVisaTypes = await ctx.prisma.visaType.findMany({
        where: { countryId: input.countryId },
        select: { id: true },
      });
      finalVisaTypeIds = allVisaTypes.map(vt => vt.id);
    } else {
      // Use provided visa type IDs
      finalVisaTypeIds = input.visaTypeIds!;

      // Check if all visa types exist and belong to the specified country
      const visaTypes = await ctx.prisma.visaType.findMany({
        where: {
          id: { in: finalVisaTypeIds },
          countryId: input.countryId,
        },
      });

      if (visaTypes.length !== finalVisaTypeIds.length) {
        throw new Error('Some visa types not found or do not belong to the specified country');
      }
    }

    // Check for conflicts based on global setting
    if (input.isGlobal) {
      // Check if any surcharge already exists for this citizenship and country combination
      const existingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
        where: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
      });

      if (existingSurcharge) {
        throw new Error('A surcharge already exists for this citizenship and country combination');
      }
    } else {
      // Check if surcharge already exists for this citizenship and country combination
      const existingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
        where: {
          citizenshipId: input.citizenshipId,
          countryId: input.countryId,
        },
        include: {
          visaTypes: {
            select: {
              visaTypeId: true,
            },
          },
        },
      });

      if (existingSurcharge) {
        // Check if any of the visa types are already linked
        const existingVisaTypeIds = existingSurcharge.visaTypes.map(vt => vt.visaTypeId);
        const conflictingVisaTypes = finalVisaTypeIds.filter(id =>
          existingVisaTypeIds.includes(id)
        );

        if (conflictingVisaTypes.length > 0) {
          throw new Error(
            'Surcharge already exists for this citizenship, country and some of the selected visa types'
          );
        }
      }
    }

    // Create the visa citizenship surcharge
    const newVisaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.create({
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        surchargeAmount: input.surchargeAmount,
        note: input.note || null,
        isGlobal: input.isGlobal,
        visaTypes: {
          create: finalVisaTypeIds.map(visaTypeId => ({
            visaTypeId,
          })),
        },
      },
      select: {
        id: true,
        citizenshipId: true,
        countryId: true,
        surchargeAmount: true,
        note: true,
        isGlobal: true,
        citizenship: {
          select: {
            id: true,
            name: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaTypes: {
          select: {
            visaType: {
              select: {
                id: true,
                name: true,
                serviceCost: true,
              },
            },
          },
        },
      },
    });

    return {
      visaCitizenshipSurcharge: newVisaCitizenshipSurcharge,
      affectedVisaTypesCount: finalVisaTypeIds.length,
    };
  });
