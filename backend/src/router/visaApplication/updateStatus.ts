import { visaApplicationUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateVisaApplicationStatusTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'cancelled', 'denied']),
  statusNote: z.string().optional(),
  revisedActivationDate: z.date().optional(),
});

export const updateVisaApplicationStatusTrpcRoute = visaApplicationUpdateProcedure
  .input(zUpdateVisaApplicationStatusTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, status, statusNote, revisedActivationDate } = input;

    // Check if visa application exists
    const existingApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id },
      include: {
        orderItem: {
          select: {
            id: true,
            orderId: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
          },
        },
      },
    });

    if (!existingApplication) {
      throw new Error('Visa application not found');
    }

    // Validate status transitions
    const currentStatus = existingApplication.status;
    const validTransitions: Record<string, string[]> = {
      pending: ['submitted', 'cancelled', 'denied'],
      submitted: ['approved', 'cancelled', 'denied'],
      approved: ['used', 'cancelled', 'denied'],
      used: ['cancelled'], // Can only be cancelled if used
      cancelled: [], // Terminal state
      denied: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    // Update visa application status
    const visaApplication = await ctx.prisma.visaApplication.update({
      where: { id },
      data: {
        status,
        statusNote,
        revisedActivationDate,
      },
      include: {
        orderItem: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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
          },
        },
        _count: {
          select: {
            clientVisas: true,
          },
        },
      },
    });

    return {
      visaApplication,
      previousStatus: currentStatus,
    };
  });
