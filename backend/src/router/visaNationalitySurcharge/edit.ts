import { visaNationalitySurchargeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisaNationalitySurchargeTrpcInput = z.object({
  id: z.string().uuid(),
  citizenshipId: z.string().uuid(),
  visaTypeId: z.string().min(1).max(100),
  surchargeAmount: z.number().min(0),
  note: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
});

export const editVisaNationalitySurchargeTrpcRoute = visaNationalitySurchargeUpdateProcedure
  .input(zEditVisaNationalitySurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if visa nationality surcharge exists
    const existingSurcharge = await ctx.prisma.visaNationalitySurcharge.findUnique({
      where: { id: input.id },
    });

    if (!existingSurcharge) {
      throw new Error('Visa nationality surcharge not found');
    }

    // Check if citizenship exists
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.citizenshipId },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if another surcharge with the same citizenship and visa type combination exists (excluding current one)
    const duplicateSurcharge = await ctx.prisma.visaNationalitySurcharge.findFirst({
      where: {
        citizenshipId: input.citizenshipId,
        visaTypeId: input.visaTypeId,
        id: {
          not: input.id,
        },
      },
    });

    if (duplicateSurcharge) {
      throw new Error('Surcharge already exists for this citizenship and visa type combination');
    }

    // Update the visa nationality surcharge
    const updatedVisaNationalitySurcharge = await ctx.prisma.visaNationalitySurcharge.update({
      where: { id: input.id },
      data: {
        citizenshipId: input.citizenshipId,
        visaTypeId: input.visaTypeId,
        surchargeAmount: input.surchargeAmount,
        note: input.note || null,
      },
      select: {
        id: true,
        citizenshipId: true,
        visaTypeId: true,
        surchargeAmount: true,
        note: true,
        citizenship: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      visaNationalitySurcharge: updatedVisaNationalitySurcharge,
    };
  });
