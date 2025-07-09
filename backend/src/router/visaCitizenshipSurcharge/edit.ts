import { visaCitizenshipSurchargeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaCitizenshipSurchargeTrpcInput = z.object({
  id: z.string().uuid(),
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeIds: z.array(z.string().uuid()).min(1, 'At least one visa type must be selected'),
  surchargeAmount: z.number().min(0),
  note: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
});

export const editVisaCitizenshipSurchargeTrpcRoute = visaCitizenshipSurchargeUpdateProcedure
  .input(zEditVisaCitizenshipSurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visa citizenship surcharge exists
    const existingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findUnique({
      where: { id: input.id },
      include: {
        visaTypes: {
          select: {
            visaTypeId: true,
          },
        },
      },
    });

    if (!existingSurcharge) {
      throw new Error('Visa citizenship surcharge not found');
    }

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

    // Check if another surcharge with the same citizenship, country and any of the visa types combination exists (excluding current one)
    const conflictingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
      where: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        id: {
          not: input.id,
        },
        visaTypes: {
          some: {
            visaTypeId: { in: input.visaTypeIds },
          },
        },
      },
      include: {
        visaTypes: {
          select: {
            visaTypeId: true,
            visaType: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (conflictingSurcharge) {
      const conflictingVisaTypes = conflictingSurcharge.visaTypes
        .filter(vt => input.visaTypeIds.includes(vt.visaTypeId))
        .map(vt => vt.visaType.name);

      throw new Error(
        `Surcharge already exists for this citizenship, country and visa type(s): ${conflictingVisaTypes.join(', ')}`
      );
    }

    // Update the visa citizenship surcharge
    const updatedVisaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.update({
      where: { id: input.id },
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        surchargeAmount: input.surchargeAmount,
        note: input.note || null,
        visaTypes: {
          deleteMany: {},
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
      visaCitizenshipSurcharge: updatedVisaCitizenshipSurcharge,
    };
  });
