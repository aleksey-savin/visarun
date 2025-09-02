import { transportReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllTransportsTrpcInput = z
  .object({
    search: z.string().optional(),
    transportTypeId: z.string().uuid().optional(),
  })
  .optional();

export const getAllTransportsTrpcRoute = transportReadProcedure
  .input(zGetAllTransportsTrpcInput)
  .query(async ({ input, ctx }) => {
    const search = input?.search;
    const transportTypeId = input?.transportTypeId;

    const transports = await ctx.prisma.transport.findMany({
      where: {
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }),
        ...(transportTypeId && {
          transportTypeId,
        }),
      },
      include: {
        transportType: true,
        seatDistribution: {
          include: {
            seatClass: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Add seat distribution summary to each transport
    const transportsWithSummary = transports.map(transport => {
      const totalAllocatedSeats = transport.seatDistribution.reduce(
        (sum, dist) => sum + dist.seatCount,
        0
      );

      return {
        ...transport,
        seatDistributionSummary: {
          totalAllocatedSeats,
          totalCapacity: transport.seatCount || 0,
          remainingSeats: (transport.seatCount || 0) - totalAllocatedSeats,
          hasDistribution: transport.seatDistribution.length > 0,
        },
      };
    });

    return {
      transports: transportsWithSummary,
    };
  });
