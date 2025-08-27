import { visaApplicationUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateVisaApplicationStatusTrpcInput = z.object({
  id: z.string().uuid(),
  status: z.enum([
    'pending_submit',
    'awaiting_approval',
    'approved',
    'pending_refund',
    'refunded',
    'denied',
    'cancelled',
  ]),
  statusNote: z.string().optional(),
  denialReason: z.string().optional(),
  cancelReason: z.string().optional(),
  revisedActivationDate: z.date().optional(),
  stampIsRecieved: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const updateVisaApplicationStatusTrpcRoute = visaApplicationUpdateProcedure
  .input(zUpdateVisaApplicationStatusTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const {
      id,
      status,
      statusNote,
      denialReason,
      cancelReason,
      revisedActivationDate,
      stampIsRecieved,
      isArchived,
    } = input;

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
      draft: ['pending_submit'],
      pending_submit: ['awaiting_approval', 'cancelled', 'pending_refund'],
      awaiting_approval: ['approved', 'denied'],
      cancelled: ['pending_refund'],
      pending_refund: ['refunded'],
      approved: [],
      refunded: [],
      denied: [],
    };

    // Allow same-status transitions when updating other fields (like stampIsRecieved)
    const isSameStatus = currentStatus === status;
    const isValidTransition = validTransitions[currentStatus]?.includes(status);

    if (!isSameStatus && !isValidTransition) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    // Update visa application status
    const visaApplication = await ctx.prisma.visaApplication.update({
      where: { id },
      data: {
        status,
        statusNote,
        denialReason,
        cancelReason,
        revisedActivationDate,
        ...(stampIsRecieved !== undefined && { stampIsRecieved }),
        ...(isArchived !== undefined && { isArchived }),
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
