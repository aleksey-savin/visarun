import { citizenshipReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneCitizenshipTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOneCitizenshipTrpcRoute = citizenshipReadProcedure
  .input(zGetOneCitizenshipTrpcInput)
  .query(async ({ input, ctx }) => {
    const citizenship = await ctx.prisma.citizenship.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        favourite: true,
        visaFree: {
          select: {
            countryId: true,
            stampDuration: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            country: {
              name: 'asc',
            },
          },
        },
        blacklisted: {
          select: {
            countryId: true,
            country: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            country: {
              name: 'asc',
            },
          },
        },
        surcharges: {
          select: {
            id: true,
            visaTypeId: true,
            surchargeAmount: true,
            note: true,
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
              },
            },
          },
          orderBy: [
            {
              country: {
                name: 'asc',
              },
            },
            {
              visaTypeId: 'asc',
            },
          ],
        },
      },
    });

    if (!citizenship) {
      throw new Error('Citizenship not found');
    }

    return { citizenship };
  });
