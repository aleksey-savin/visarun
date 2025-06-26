import { visaCitizenshipSurchargeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaCitizenshipSurchargeTrpcInput = z.object({
  id: z.string().uuid(),
  citizenshipId: z.string().uuid(),
  countryId: z.string().uuid(),
  visaTypeId: z.string().uuid(),
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

    // Check if another surcharge with the same citizenship, country and visa type combination exists (excluding current one)
    const duplicateSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
      where: {
        citizenshipId: input.citizenshipId,
        countryId: input.countryId,
        visaTypeId: input.visaTypeId,
        id: {
          not: input.id,
        },
      },
    });

    if (duplicateSurcharge) {
      throw new Error(
        'Surcharge already exists for this citizenship, country and visa type combination'
      );
    }

    // Update the visa citizenship surcharge
    const updatedVisaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.update({
      where: { id: input.id },
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
      visaCitizenshipSurcharge: updatedVisaCitizenshipSurcharge,
    };
  });
