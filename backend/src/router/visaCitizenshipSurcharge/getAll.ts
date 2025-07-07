import { visaCitizenshipSurchargeReadProcedure } from '../../lib/trpc.js';

export const getAllVisaCitizenshipSurchargeTrpcRoute = visaCitizenshipSurchargeReadProcedure.query(
  async ({ ctx }) => {
    const visaCitizenshipSurcharges = await ctx.prisma.visaCitizenshipSurcharge.findMany({
      orderBy: [
        {
          citizenship: {
            name: 'asc',
          },
        },
        {
          country: {
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
      },
    });

    return { visaCitizenshipSurcharges };
  }
);
