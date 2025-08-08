import { orderReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zGetOrderTrpcInput = z.object({
  id: z.string().uuid(),
});

export const getOrderTrpcRoute = orderReadProcedure
  .input(zGetOrderTrpcInput)
  .query(async ({ input, ctx }) => {
    const order = await ctx.prisma.order.findUnique({
      where: { id: input.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            email: true,
            contactMethods: {
              select: {
                id: true,
                value: true,
                url: true,
                method: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        items: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                citizenshipId: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                    abbreviation: true,
                    blacklisted: true,
                    surcharges: true,
                    visaFree: true,
                    RequirementCitizenship: true,
                  },
                },
              },
            },
            discountRule: {
              select: {
                id: true,
                name: true,
                discountType: true,
                discountValue: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order) {
      const clients = await ctx.prisma.client.findMany({
        where: {
          userId: order.userId,
        },
        include: {
          citizenship: true,
        },
      });

      // Fetch visa applications for items with serviceType = 'visa'
      const visaItems = order.items.filter(item => item.serviceType === 'visa');
      const visaItemIds = visaItems.map(item => item.id);

      const visaApplications =
        visaItemIds.length > 0
          ? await ctx.prisma.visaApplication.findMany({
              where: {
                orderItemId: { in: visaItemIds },
              },
              select: {
                id: true,
                orderItemId: true,
                plannedCountryEntryDate: true,
                applicationCode: true,
                submittedByAgent: true,
                isMultientry: true,
                note: true,
                revisedActivationDate: true,
                statusNote: true,
                status: true,
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
                },
              },
            })
          : [];

      // Create a map for O(1) lookup since it's one-to-one relationship
      const visaApplicationMap = new Map(visaApplications.map(va => [va.orderItemId, va]));

      // Add visa applications to corresponding items
      const itemsWithVisaApplications = order.items.map(item => {
        if (item.serviceType === 'visa') {
          const visaApplication = visaApplicationMap.get(item.id);
          return { ...item, visaApplication: visaApplication || null };
        }
        return { ...item, visaApplication: null };
      });

      return {
        ...order,
        items: itemsWithVisaApplications,
        clients,
      };
    }
  });
