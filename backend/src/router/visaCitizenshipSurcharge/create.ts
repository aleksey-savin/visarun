import { visaCitizenshipSurchargeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaCitizenshipSurchargeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeIds: z.array(z.string().uuid()).min(1, 'At least one visa type must be selected'),
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

    // Check if all visa types exist and belong to the specified country
    const visaTypes = await ctx.prisma.visaType.findMany({
      where: {
        id: { in: input.visaTypeIds },
        countryId: input.countryId,
      },
    });

    if (visaTypes.length !== input.visaTypeIds.length) {
      throw new Error('Some visa types not found or do not belong to the specified country');
    }

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
      const conflictingVisaTypes = input.visaTypeIds.filter(id => existingVisaTypeIds.includes(id));

      if (conflictingVisaTypes.length > 0) {
        throw new Error(
          'Surcharge already exists for this citizenship, country and some of the selected visa types'
        );
      }
    }

    // Create the visa citizenship surcharge
    const newVisaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.create({
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        surchargeAmount: input.surchargeAmount,
        note: input.note || null,
        visaTypes: {
          create: input.visaTypeIds.map(visaTypeId => ({
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
    };
  });
