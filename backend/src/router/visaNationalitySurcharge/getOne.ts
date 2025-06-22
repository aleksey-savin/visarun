import { visaNationalitySurchargeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneVisaNationalitySurchargeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneVisaNationalitySurchargeTrpcRoute = visaNationalitySurchargeReadProcedure
  .input(zGetOneVisaNationalitySurchargeTrpcInput)
  .query(async ({ input, ctx }) => {
    const visaNationalitySurcharge = await ctx.prisma.visaNationalitySurcharge.findUnique({
      where: { id: input.id },
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
            favourite: true,
          },
        },
      },
    });

    if (!visaNationalitySurcharge) {
      throw new Error('Visa nationality surcharge not found');
    }

    return { visaNationalitySurcharge };
  });
