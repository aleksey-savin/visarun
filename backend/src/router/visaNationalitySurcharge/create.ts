import { visaNationalitySurchargeCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisaNationalitySurchargeTrpcInput = z.object({
  citizenshipId: z.string().uuid(),
  visaTypeId: z.string().min(1).max(100),
  surchargeAmount: z.number().min(0),
  note: z.preprocess(
    val => (typeof val === 'string' && val.trim() === '' ? null : val),
    z.string().min(1).max(500).nullable().optional()
  ),
});

export const createVisaNationalitySurchargeTrpcRoute = visaNationalitySurchargeCreateProcedure
  .input(zCreateVisaNationalitySurchargeTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if citizenship exists
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.citizenshipId },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    // Check if surcharge already exists for this citizenship and visa type combination
    const existingSurcharge = await ctx.prisma.visaNationalitySurcharge.findFirst({
      where: {
        citizenshipId: input.citizenshipId,
        visaTypeId: input.visaTypeId,
      },
    });

    if (existingSurcharge) {
      throw new Error('Surcharge already exists for this citizenship and visa type combination');
    }

    // Create the visa nationality surcharge
    const newVisaNationalitySurcharge = await ctx.prisma.visaNationalitySurcharge.create({
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
      visaNationalitySurcharge: newVisaNationalitySurcharge,
    };
  });
