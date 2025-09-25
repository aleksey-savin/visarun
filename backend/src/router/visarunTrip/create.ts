import { visarunTripCreateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zCreateVisarunTripTrpcInput = z.object({
  routeId: z.string().uuid(),
  scheduleId: z.string().uuid().optional(),
  departureDateTime: z.string().transform(str => new Date(str)),
  status: z.enum(['scheduled', 'in_process', 'completed']).optional().default('scheduled'),
  notes: z.string().optional(),
  cancelReason: z.string().optional(),
  isFromSchedule: z.boolean().optional().default(false),
});

export const createVisarunTripTrpcRoute = visarunTripCreateProcedure
  .input(zCreateVisarunTripTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const trip = await ctx.prisma.visarunTrip.create({
      data: {
        routeId: input.routeId,
        scheduleId: input.scheduleId,
        departureDateTime: input.departureDateTime,
        status: input.status,
        notes: input.notes,
        cancelReason: input.cancelReason,
        isFromSchedule: input.isFromSchedule,
      },
    });

    return trip;
  });
