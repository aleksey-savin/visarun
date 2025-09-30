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
            phoneNumber: true,
            updatedAt: true,
            contactMethods: {
              select: {
                id: true,
                value: true,
                url: true,
                method: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
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
        clients: {
          select: {
            id: true,
            client: {
              select: {
                id: true,
                userId: true,
                isPrimary: true,
                preConfirmPassportIsValid: true,
                passportExpirationDate: true,
                prevViolations: true,
                prevViolationsDesc: true,
                isOutsideTheCountry: true,
                isOutsideTheCountryAt: true,
                firstName: true,
                lastName: true,
                email: true,
                requirements: true,
                documents: true,
                citizenship: {
                  select: {
                    id: true,
                    name: true,
                    abbreviation: true,
                    favourite: true,
                    emoji: true,
                    blacklisted: true,
                    surcharges: true,
                    visaFree: true,
                    RequirementCitizenship: true,
                  },
                },
              },
            },
          },
        },
        orderPayments: {
          select: {
            id: true,
            paymentMethod: true,
            amount: true,
            amountInSelectedCurrency: true,
            confirmPaymentWithoutDocument: true,
            documentUrl: true,
            acceptedById: true,
            acceptedByUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            currency: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        items: {
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
      /** const clients = await ctx.prisma.client.findMany({
        where: {
          userId: order.userId,
        },
        include: {
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
        }); **/

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
                type: true,
                plannedCountryEntryDate: true,
                plannedCountryExitDate: true,
                plannedCompletionDate: true,
                stampUntilDate: true,
                applicationCode: true,
                submittedByAgent: true,
                clientIsInTheCountry: true,
                isMultientry: true,
                note: true,
                revisedActivationDate: true,
                statusNote: true,
                status: true,
                createdAt: true,
                updatedAt: true,
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
                    accelerationCost: true,
                    accelerationAvailable: true,
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

      return {
        ...order,
        clients: order.clients.map(orderClient => ({
          ...orderClient.client,
        })),
        visaApplications,
      };
    }
  });
