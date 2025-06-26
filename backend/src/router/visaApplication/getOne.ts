import { visaApplicationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaApplicationTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getVisaApplicationTrpcRoute = visaApplicationReadProcedure
  .input(zGetVisaApplicationTrpcInput)
  .query(async ({ input, ctx }) => {
    const visaApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id: input.id },
      include: {
        orderItem: {
          include: {
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
        clientVisas: {
          select: {
            id: true,
            validFrom: true,
            validTo: true,
            notifiedExpiry: true,
          },
          orderBy: {
            validFrom: 'desc',
          },
        },
      },
    });

    if (!visaApplication) {
      throw new Error('Visa application not found');
    }

    return {
      visaApplication,
    };
  });
