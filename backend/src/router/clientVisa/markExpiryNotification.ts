import { clientVisaUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zMarkExpiryNotificationTrpcInput = z.object({
  id: z.string().uuid(),
  notified: z.boolean().default(true),
});

export const markExpiryNotificationTrpcRoute = clientVisaUpdateProcedure
  .input(zMarkExpiryNotificationTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const { id, notified } = input;

    // Check if client visa exists
    const existingClientVisa = await ctx.prisma.clientVisa.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    if (!existingClientVisa) {
      throw new Error('Client visa not found');
    }

    // Calculate expiry information
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (existingClientVisa.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isExpired = daysUntilExpiry < 0;
    const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry >= 0;

    // Update notification status
    const clientVisa = await ctx.prisma.clientVisa.update({
      where: { id },
      data: {
        notifiedExpiry: notified,
      },
      include: {
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
          },
        },
        visaApplication: {
          select: {
            id: true,
            applicationCode: true,
            status: true,
          },
        },
      },
    });

    return {
      clientVisa: {
        ...clientVisa,
        daysUntilExpiry,
        isExpired,
        isExpiringSoon,
      },
      message: notified
        ? 'Expiry notification marked as sent'
        : 'Expiry notification marked as not sent',
    };
  });
