import { visaCitizenshipSurchargeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneVisaCitizenshipSurchargeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneVisaCitizenshipSurchargeTrpcRoute = visaCitizenshipSurchargeReadProcedure
  .input(zGetOneVisaCitizenshipSurchargeTrpcInput)
  .query(async ({ input, ctx }) => {
    const visaCitizenshipSurcharge = await ctx.prisma.visaCitizenshipSurcharge.findUnique({
      where: { id: input.id },
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
            favourite: true,
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
          },
        },
      },
    });

    if (!visaCitizenshipSurcharge) {
      throw new Error('Visa citizenship surcharge not found');
    }

    return { visaCitizenshipSurcharge };
  });
