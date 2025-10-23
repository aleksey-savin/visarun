import { visarunPassengerReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetAllVisarunPassengersTrpcInput = z.object({
  tripId: z.string().uuid().optional(),
});

export const getAllVisarunPassengersTrpcRoute = visarunPassengerReadProcedure
  .input(zGetAllVisarunPassengersTrpcInput)
  .query(async ({ input, ctx }) => {
    const { tripId } = input;
    const passengers = await ctx.prisma.visarunPassenger.findMany({
      where: tripId ? { tripId } : {},
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            isPrimary: true,
          },
        },
        seatClass: {
          select: {
            icon: true,
            name: true,
          },
        },
        orderItem: {
          select: {
            orderId: true,
            finalPrice: true,
            order: {
              include: {
                items: {
                  select: {
                    id: true,
                    serviceType: true,
                    finalPrice: true,
                    client: {
                      select: {
                        lastName: true,
                        firstName: true,
                      },
                    },
                  },
                },
                orderPayments: true,
              },
            },
          },
        },
      },
    });
    return passengers;
  });
