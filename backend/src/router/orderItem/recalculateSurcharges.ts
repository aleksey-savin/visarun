import { orderItemUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zRecalculateOrderItemSurchargesTrpcInput = z.object({
  clientId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
});

export const recalculateOrderItemSurchargesTrpcRoute = orderItemUpdateProcedure
  .input(zRecalculateOrderItemSurchargesTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Get client with citizenship data
    const client = await ctx.prisma.client.findUnique({
      where: { id: input.clientId },
      include: {
        citizenship: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Find all order items for this client, optionally filtered by order
    const whereClause: {
      clientId: string;
      serviceType: 'visa';
      orderId?: string;
    } = {
      clientId: input.clientId,
      serviceType: 'visa', // Only visa services have citizenship surcharges
    };

    if (input.orderId) {
      whereClause.orderId = input.orderId;
    }

    const orderItems = await ctx.prisma.orderItem.findMany({
      where: whereClause,
      include: {
        order: true,
        VisaApplication: {
          include: {
            country: true,
            visaType: true,
          },
        },
      },
    });

    const updatedOrderItems = [];
    const notifications = [];

    for (const orderItem of orderItems) {
      // Only process draft orders
      if (orderItem.order.status !== 'draft') {
        continue;
      }

      let surchargeAmount = 0;
      let surchargeNote = null;
      let appliedSurcharge = null;

      if (client.citizenship) {
        // Get visa application for this order item
        const visaApplication = orderItem.VisaApplication[0];

        if (visaApplication) {
          // Look for applicable citizenship surcharge
          const surchargeQuery = {
            citizenshipId: client.citizenship.id,
            countryId: visaApplication.countryId,
          };

          let surcharge = null;

          // If visa type is specified, look for specific surcharge first
          if (visaApplication.visaTypeId) {
            surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
              where: {
                ...surchargeQuery,
                isGlobal: false,
                visaTypes: {
                  some: {
                    visaTypeId: visaApplication.visaTypeId,
                  },
                },
              },
              include: {
                citizenship: true,
                country: true,
              },
            });
          }

          // If no specific surcharge found, look for global surcharge
          if (!surcharge) {
            surcharge = await ctx.prisma.visaCitizenshipSurcharge.findFirst({
              where: {
                ...surchargeQuery,
                isGlobal: true,
              },
              include: {
                citizenship: true,
                country: true,
              },
            });
          }

          if (surcharge) {
            surchargeAmount = surcharge.surchargeAmount;
            surchargeNote = surcharge.note;
            appliedSurcharge = {
              id: surcharge.id,
              citizenship: surcharge.citizenship.name,
              country: surcharge.country.name,
              amount: surcharge.surchargeAmount,
              isGlobal: surcharge.isGlobal,
              note: surcharge.note,
            };
          }
        }
      }

      // Calculate new final price
      const priceAfterDiscount = Math.max(0, orderItem.basePrice - orderItem.discountAmount);
      const newFinalPrice = priceAfterDiscount + surchargeAmount;

      // Update note to include surcharge information if applicable
      let updatedNote = orderItem.note;
      if (surchargeNote && surchargeAmount > 0) {
        const surchargeInfo = `Citizenship surcharge: ${surchargeNote}`;
        if (updatedNote) {
          updatedNote = updatedNote.includes('Citizenship surcharge:')
            ? updatedNote.replace(/Citizenship surcharge:.*?(\||$)/, `${surchargeInfo}$1`)
            : `${updatedNote} | ${surchargeInfo}`;
        } else {
          updatedNote = surchargeInfo;
        }
      } else if (updatedNote) {
        // Remove existing surcharge info if no surcharge applies
        updatedNote = updatedNote
          .replace(/\s*\|\s*Citizenship surcharge:.*?(\||\s*$)/, '$1')
          .replace(/^Citizenship surcharge:.*?(\|\s*)?/, '')
          .trim();
        if (updatedNote === '') {
          updatedNote = null;
        }
      }

      // Update the order item
      const updatedOrderItem = await ctx.prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          finalPrice: newFinalPrice,
          note: updatedNote,
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
          VisaApplication: {
            include: {
              country: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      updatedOrderItems.push({
        ...updatedOrderItem,
        appliedSurcharge,
        surchargeAmount,
        previousFinalPrice: orderItem.finalPrice,
      });

      // Create notification for changed surcharge
      if (orderItem.finalPrice !== newFinalPrice) {
        const visaApp = updatedOrderItem.VisaApplication[0];
        const countryName = visaApp?.country?.name || 'неизвестная страна';

        if (surchargeAmount > 0) {
          notifications.push({
            type: 'surcharge_added' as const,
            message: `Добавлен сбор для граждан ${client.citizenship?.name} при въезде в ${countryName}: ${surchargeAmount} VND`,
            details: surchargeNote || 'Специальный сбор для определённых граждан',
            orderItemId: orderItem.id,
            amount: surchargeAmount,
            priceDifference: newFinalPrice - orderItem.finalPrice,
          });
        } else if (orderItem.finalPrice > newFinalPrice) {
          notifications.push({
            type: 'surcharge_removed' as const,
            message: `Убран сбор для граждан ${client.citizenship?.name} при въезде в ${countryName}`,
            details: 'Сбор больше не применяется для нового гражданства',
            orderItemId: orderItem.id,
            priceDifference: newFinalPrice - orderItem.finalPrice,
          });
        }
      }
    }

    return {
      updatedOrderItems,
      notifications,
      summary: {
        totalItemsProcessed: orderItems.length,
        totalItemsUpdated: updatedOrderItems.length,
        totalPriceChange: updatedOrderItems.reduce(
          (sum, item) => sum + (item.finalPrice - item.previousFinalPrice),
          0
        ),
      },
    };
  });
