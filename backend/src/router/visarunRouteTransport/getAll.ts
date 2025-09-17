import { visarunRouteTransportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllVisarunRouteTransportsTrpcInput = z
  .object({
    routeId: z.string().uuid().optional(),
    transportId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    search: z.string().optional(),
  })
  .optional();

export const getAllVisarunRouteTransportsTrpcRoute = visarunRouteTransportReadProcedure
  .input(zGetAllVisarunRouteTransportsTrpcInput)
  .query(async ({ input, ctx }) => {
    const routeId = input?.routeId;
    const transportId = input?.transportId;
    const isActive = input?.isActive;
    const search = input?.search;

    const routeTransports = await ctx.prisma.visarunRouteTransport.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(transportId && { transportId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            {
              route: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
            {
              transport: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
            {
              transport: {
                transportType: {
                  name: {
                    contains: search,
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        }),
      },
      include: {
        route: true,
        transport: {
          include: {
            transportType: true,
            seatDistribution: {
              include: {
                seatClass: true,
              },
            },
          },
        },
      },
      orderBy: [{ route: { name: 'asc' } }, { transport: { name: 'asc' } }],
    });

    // Add summary information to each route transport
    const routeTransportsWithSummary = routeTransports.map(routeTransport => {
      const totalSeats = routeTransport.transport.seatCount || 0;
      const allocatedSeats =
        routeTransport.transport.seatDistribution?.reduce((sum, dist) => sum + dist.seatCount, 0) ||
        0;

      return {
        ...routeTransport,
        summary: {
          totalSeats,
          allocatedSeats,
          remainingSeats: totalSeats - allocatedSeats,
          hasSeatingArrangement: allocatedSeats > 0,
        },
      };
    });

    return {
      routeTransports: routeTransportsWithSummary,
    };
  });
