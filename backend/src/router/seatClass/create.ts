import { seatClassCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateSeatClassTrpcInput = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const createSeatClassTrpcRoute = seatClassCreateProcedure
  .input(zCreateSeatClassTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if seat class with the same name already exists
    const existingSeatClass = await ctx.prisma.seatClass.findUnique({
      where: { name: input.name },
    });

    if (existingSeatClass) {
      throw new Error('Seat class with this name already exists');
    }

    // Create the seat class
    const seatClass = await ctx.prisma.seatClass.create({
      data: {
        name: input.name,
        description: input.description,
        icon: input.icon,
      },
    });

    return {
      seatClass,
    };
  });
