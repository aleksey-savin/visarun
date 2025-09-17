import { z } from 'zod';
import { visarunSeatPriceReadProcedure } from '../../lib/trpc.js';

export const zGetAllVisarunSeatPricesTrpcInput = z
  .object({
    routeId: z.string().uuid().optional(),
    seatClassId: z.string().uuid().optional(),
    search: z.string().optional(),
  })
  .optional();

export const getAllVisarunSeatPricesTrpcRoute = visarunSeatPriceReadProcedure
  .input(zGetAllVisarunSeatPricesTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeId = input?.routeId;
    const seatClassId = input?.seatClassId;
    const search = input?.search;

    const visarunSeatPrices = await ctx.prisma.visarunSeatPrice.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(seatClassId && { seatClassId }),
        ...(search && {
          OR: [
            {
              seatClass: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
            {
              route: {
                id: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          ],
        }),
      },
      include: {
        seatClass: true,
        route: {
          include: {
            routeStops: {
              include: {
                city: {
                  include: {
                    country: true,
                  },
                },
              },
              orderBy: {
                stopOrder: 'asc',
              },
            },
          },
        },
      },
      orderBy: [
        {
          route: {
            id: 'asc',
          },
        },
        {
          seatClass: {
            name: 'asc',
          },
        },
      ],
    });

    return {
      visarunSeatPrices,
    };
  });
