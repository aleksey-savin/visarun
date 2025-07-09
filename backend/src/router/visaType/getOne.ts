import { visaTypeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaTypeTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getVisaTypeTrpcRoute = visaTypeReadProcedure
  .input(zGetVisaTypeTrpcInput)
  .query(async ({ input, ctx }) => {
    const visaType = await ctx.prisma.visaType.findUnique({
      where: { id: input.id },
      include: {
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaApplications: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
          },
          orderBy: {
            applicationCode: 'asc',
          },
        },
        clientVisas: {
          select: {
            id: true,
            validFrom: true,
            validTo: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            validFrom: 'desc',
          },
        },
        surcharges: {
          select: {
            id: true,
            surcharge: {
              select: {
                surchargeAmount: true,
                note: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            surcharge: {
              citizenship: {
                name: 'asc',
              },
            },
          },
        },
        _count: {
          select: {
            visaApplications: true,
            clientVisas: true,
          },
        },
      },
    });

    if (!visaType) {
      throw new Error('Visa type not found');
    }

    return {
      visaType,
    };
  });
