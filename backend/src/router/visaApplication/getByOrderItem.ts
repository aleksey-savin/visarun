import { visaApplicationReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetVisaApplicationsByOrderItemTrpcInput = z.object({
  orderItemId: z.string().uuid(),
});

export const getVisaApplicationsByOrderItemTrpcRoute = visaApplicationReadProcedure
  .input(zGetVisaApplicationsByOrderItemTrpcInput)
  .query(async ({ input, ctx }) => {
    const { orderItemId } = input;

    // Check if order item exists
    const orderItem = await ctx.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        order: {
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
        },
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
    });

    if (!orderItem) {
      throw new Error('Order item not found');
    }

    // Get visa applications for this order item
    const visaApplications = await ctx.prisma.visaApplication.findMany({
      where: {
        orderItemId,
      },
      include: {
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
      orderItem,
      visaApplications,
    };
  });
