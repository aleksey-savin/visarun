import { visaApplicationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaApplicationsByOrderIdTrpcInput = z.object({
  orderId: z.string().uuid(),
});

export const getVisaApplicationsByOrderIdTrpcRoute = visaApplicationReadProcedure
  .input(zGetVisaApplicationsByOrderIdTrpcInput)
  .query(async ({ input, ctx }) => {
    const { orderId } = input;

    // Check if order exists
    const order = await ctx.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get visa applications for all order items in this order
    const visaApplications = await ctx.prisma.visaApplication.findMany({
      where: {
        orderItem: {
          orderId,
        },
      },
      include: {
        orderItem: {
          select: {
            id: true,
            serviceTypeId: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        country: {
          select: {
            id: true,
            name: true,
          },
        },
        visaType: {
          select: {
            id: true,
            name: true,
            serviceCost: true,
            isMultientry: true,
            multientryExtraCost: true,
            processingMode: true,
            processingUnit: true,
            processingValueFixed: true,
            processingValueMin: true,
            processingValueMax: true,
          },
        },
        clientVisas: {
          select: {
            id: true,
            validFrom: true,
            validTo: true,
            notifiedExpiry: true,
          },
          orderBy: {
            validFrom: 'desc',
          },
        },
        _count: {
          select: {
            clientVisas: true,
          },
        },
      },
      orderBy: [{ applicationCode: 'asc' }],
    });

    return {
      order,
      visaApplications,
    };
  });
