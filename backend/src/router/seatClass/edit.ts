import { seatClassUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditSeatClassTrpcInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const editSeatClassTrpcRoute = seatClassUpdateProcedure
  .input(zEditSeatClassTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if seat class exists
    const existingSeatClass = await ctx.prisma.seatClass.findUnique({
      where: { id: input.id },
    });

    if (!existingSeatClass) {
      throw new Error('Seat class not found');
    }

    // Check if another seat class with the same name exists
    const duplicateSeatClass = await ctx.prisma.seatClass.findUnique({
      where: {
        name: input.name,
        NOT: { id: input.id },
      },
    });

    if (duplicateSeatClass) {
      throw new Error('Seat class with this name already exists');
    }

    // Update the seat class
    const seatClass = await ctx.prisma.seatClass.update({
      where: { id: input.id },
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
