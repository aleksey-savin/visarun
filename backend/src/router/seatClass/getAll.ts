import { seatClassReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllSeatClassesTrpcInput = z
  .object({
    search: z.string().optional(),
  })
  .optional();

export const getAllSeatClassesTrpcRoute = seatClassReadProcedure
  .input(zGetAllSeatClassesTrpcInput)
  .query(async ({ input, ctx }) => {
    const search = input?.search;

    const seatClasses = await ctx.prisma.seatClass.findMany({
      where: search
        ? {
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
          }
        : undefined,
      orderBy: {
        name: 'asc',
      },
    });

    return {
      seatClasses,
    };
  });
