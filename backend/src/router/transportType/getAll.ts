import { transportTypeReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllTransportTypesTrpcInput = z
  .object({
    search: z.string().optional(),
  })
  .optional();

export const getAllTransportTypesTrpcRoute = transportTypeReadProcedure
  .input(zGetAllTransportTypesTrpcInput)
  .query(async ({ input, ctx }) => {
    const search = input?.search;

    const transportTypes = await ctx.prisma.transportType.findMany({
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: {
        name: 'asc',
      },
    });

    return {
      transportTypes,
    };
  });
