import { visaCitizenshipSurchargeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaCitizenshipSurchargeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid(),
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

    // Check if visa type exists and belongs to the specified country
    const visaType = await ctx.prisma.visaType.findUnique({
      where: { id: input.visaTypeId },
    });

    if (!visaType) {
      throw new Error('Visa type not found');
    }

    if (visaType.countryId !== input.countryId) {
      throw new Error('Visa type does not belong to the specified country');
    }

    // Check if surcharge already exists for this citizenship, country and visa type combination
    const existingSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
      where: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        visaTypeId: input.visaTypeId,
      },
    });

    if (existingSurcharge) {
      throw new Error(
        'Surcharge already exists for this citizenship, country and visa type combination'
      );
    }

    // Create the visa citizenship surcharge
    const newVisaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.create({
      data: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        visaTypeId: input.visaTypeId,
        surchargeAmount: input.surchargeAmount,
        note: input.note || null,
      },
      select: {
        id: true,
        citizenshipId: true,
        countryId: true,
        visaTypeId: true,
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
      },
    });

    return {
      visaCitizenshipSurcharge: newVisaCitizenshipSurcharge,
    };
  });
