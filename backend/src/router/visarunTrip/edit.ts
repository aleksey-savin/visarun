import { visarunTripUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zEditVisarunTripTrpcInput = z.object({
  id: z.string().uuid(),
  routeId: z.string().uuid().optional(),
  scheduleId: z.string().uuid().optional(),
  departureDateTime: z
    .string()
    .transform(str => new Date(str))
    .optional(),
  status: z.enum(['scheduled', 'in_process', 'completed']).optional(),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
  isFromSchedule: z.boolean().optional(),
});

export const editVisarunTripTrpcRoute = visarunTripUpdateProcedure
  .input(zEditVisarunTripTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, ...updateData } = input;

    const trip = await ctx.prisma.visarunTrip.update({
      where: { id },
      data: updateData,
      include: {
        route: {
          select: {
            id: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return trip;
  });
