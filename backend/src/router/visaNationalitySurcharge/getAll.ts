import { visaNationalitySurchargeReadProcedure } from '../../lib/trpc.js';

export const getAllVisaNationalitySurchargeTrpcRoute = visaNationalitySurchargeReadProcedure.query(
  async ({ ctx }) => {
    const visaNationalitySurcharges = await ctx.prisma.visaNationalitySurcharge.findMany({
      orderBy: [
        {
          citizenship: {
            name: 'asc',
          },
        },
        {
          visaTypeId: 'asc',
        },
      ],
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

    return { visaNationalitySurcharges };
  }
);
