import { clientVisaReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetClientVisaTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getClientVisaTrpcRoute = clientVisaReadProcedure
  .input(zGetClientVisaTrpcInput)
  .query(async ({ input, ctx }) => {
    const clientVisa = await ctx.prisma.clientVisa.findUnique({
      where: { id: input.id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            citizenship: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        country: {
          select: {
            id: true,
            name: true,
            eVisaAvailable: true,
            multivisaAvailable: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
            multientryExtraCost: true,
            processingMode: true,
            processingUnit: true,
            processingValueFixed: true,
            processingValueMin: true,
            processingValueMax: true,
            submissionDayIncluded: true,
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
            submittedByAgent: true,
            note: true,
            statusNote: true,
            revisedActivationDate: true,
            orderItem: {
              select: {
                id: true,
                order: {
                  select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!clientVisa) {
      throw new Error('Client visa not found');
    }

    // Calculate days until expiry
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (clientVisa.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

    return {
      clientVisa: {
        ...clientVisa,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
      },
    };
  });
