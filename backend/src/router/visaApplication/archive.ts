import { visaApplicationUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zArchiveVisaApplicationTrpcInput = z.object({
  id: z.string().uuid(),
  isArchived: z.boolean(),
});

export const archiveVisaApplicationTrpcRoute = visaApplicationUpdateProcedure
  .input(zArchiveVisaApplicationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, isArchived } = input;

    // Check if visa application exists
    const existingApplication = await ctx.prisma.visaApplication.findUnique({
      where: { id },
      select: {
        id: true,
        isArchived: true,
        status: true,
        orderItem: {
          select: {
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
            name: true,
          },
        },
        visaType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingApplication) {
      throw new Error('Visa application not found');
    }

    // Update visa application archive status
    const visaApplication = await ctx.prisma.visaApplication.update({
      where: { id },
      data: {
        isArchived,
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
      action: isArchived ? 'archived' : 'unarchived',
      message: `Visa application has been ${isArchived ? 'archived' : 'unarchived'} successfully`,
    };
  });
