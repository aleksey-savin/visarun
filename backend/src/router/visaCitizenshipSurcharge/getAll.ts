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
          surchargeAmount: 'asc',
        },
      ],
      select: {
        id: true,
        citizenshipId: true,
        countryId: true,
        surchargeAmount: true,
        note: true,
        isGlobal: true,
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
        visaTypes: {
          select: {
            visaType: {
              select: {
                id: true,
                name: true,
                serviceCost: true,
                isMultientry: true,
              },
            },
          },
        },
      },
    });

    return { visaCitizenshipSurcharges };
  }
);
