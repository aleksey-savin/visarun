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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
                birthDate: true,
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
                  bankingDetails: true,
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
      const visaItems = order.items.filter(item =>
        ['visa', 'acceleration'].includes(item.serviceType)
      );
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


        // Fetch currency exchanges for items with serviceType = 'currencyExchange'
        const currencyExchangeItems = order.items.filter(item => item.serviceType === 'currencyExchange');
        const currencyExchangeItemIds = currencyExchangeItems.map(item => item.id);

        const currencyExchanges =
            currencyExchangeItemIds.length > 0
                ? await ctx.prisma.currencyExchange.findMany({
                    where: {
                        orderItemId: { in: currencyExchangeItemIds },
                    },
                })
                : [];

      // Fetch visarun passengers for items with serviceType = 'visarun'
      const visarunItems = order.items.filter(item => item.serviceType === 'visarun');
      const visarunItemIds = visarunItems.map(item => item.id);

      const visarunPassengers =
        visarunItemIds.length > 0
          ? await ctx.prisma.visarunPassenger.findMany({
              where: {
                orderItemId: { in: visarunItemIds },
              },
              include: {
                seatClass: {
                  select: {
                    id: true,
                    name: true,
                    icon: true,
                  },
                },
                trip: {
                  select: {
                    id: true,
                    departureDateTime: true,
                    route: {
                      select: {
                        id: true,
                        name: true,
                        routeStops: {
                          select: {
                            id: true,
                            stopType: true,
                            departureTime: true,
                            arrivalTime: true,
                            waitingDuration: true,
                            city: {
                              select: {
                                id: true,
                                name: true,
                              },
                            },
                          },
                        },
                        transports: {
                          where: {
                            isActive: true,
                          },
                          select: {
                            id: true,
                            transport: {
                              select: {
                                id: true,
                                name: true,
                                seatCount: true,
                                transportType: {
                                  select: {
                                    id: true,
                                    name: true,
                                  },
                                },
                                seatingChart: {
                                  select: {
                                    id: true,
                                    transportId: true,
                                  },
                                },
                              },
                            },
                          },
                        },
                        prices: {
                          select: {
                            id: true,
                            price: true,
                            seatClass: {
                              select: {
                                id: true,
                                name: true,
                                icon: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                tripTransport: {
                  select: {
                    id: true,
                    transport: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                pickupStop: {
                  select: {
                    id: true,
                    city: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                pickupLocation: {
                  select: {
                    id: true,
                    name: true,
                    address: true,
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
        visarunPassengers,
          currencyExchanges
      };
    }
  });
