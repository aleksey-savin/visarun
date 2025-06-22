import { cityReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOneCityTrpcInput = z.object({
  id: z.string().min(1),
});

export const getOneCityTrpcRoute = cityReadProcedure
  .input(zGetOneCityTrpcInput)
  .query(async ({ input, ctx }) => {
    const city = await ctx.prisma.city.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        countryId: true,
        country: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!city) {
      throw new Error('City not found');
    }

    return { city };
  });
