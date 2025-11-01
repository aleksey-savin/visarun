import { orderDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteOrderTrpcInput = z.object({
  id: z.string().uuid(),
});

export const deleteOrderTrpcRoute = orderDeleteProcedure
  .input(zDeleteOrderTrpcInput)
  .mutation(async ({ input, ctx }) => {
    // Check if order exists
    const existingOrder = await ctx.prisma.order.findUnique({
      where: { id: input.id },
      include: {
        items: {
          include: {
            VisaApplication: true,
            VisarunPassenger: true,
            currencyExchange: true,
          },
        },
        orderPayments: true,
        OrderPickupAddress: true,
        clients: true,
      },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Check if user is admin or has force delete permission
    const isAdmin = ctx.user?.roles?.includes('admin');
    const hasForceDeletePermission = ctx.user?.permissions?.includes('orders.forceDelete');

    // If order is not draft, user must be admin or have force delete permission
    if (existingOrder.status !== 'draft' && !isAdmin && !hasForceDeletePermission) {
      throw new Error(
        'Only draft orders can be deleted with regular permission. Force delete permission or admin role required for non-draft orders.'
      );
    }

    try {
      // If order is not draft and user is admin or has force delete permission, perform cascading delete
      if (existingOrder.status !== 'draft' && (isAdmin || hasForceDeletePermission)) {
        // Delete in the correct order to handle foreign key constraints

        // 1. Delete all VisaApplications associated with order items
        for (const item of existingOrder.items) {
          if (item.VisaApplication && item.VisaApplication.length > 0) {
            await ctx.prisma.visaApplication.deleteMany({
              where: {
                orderItemId: item.id,
              },
            });
          }
        }

        // 2. Delete all VisarunPassengers associated with order items
        for (const item of existingOrder.items) {
          if (item.VisarunPassenger && item.VisarunPassenger.length > 0) {
            await ctx.prisma.visarunPassenger.deleteMany({
              where: {
                orderItemId: item.id,
              },
            });
          }
        }

        // 3. Delete all CurrencyExchanges (they have unique orderItemId constraint)
        for (const item of existingOrder.items) {
          if (item.currencyExchange) {
            await ctx.prisma.currencyExchange.delete({
              where: {
                id: item.currencyExchange.id,
              },
            });
          }
        }

        // 4. Delete all OrderItems
        await ctx.prisma.orderItem.deleteMany({
          where: {
            orderId: input.id,
          },
        });

        // 5. Delete all OrderPayments
        await ctx.prisma.orderPayment.deleteMany({
          where: {
            orderId: input.id,
          },
        });

        // 6. Delete all OrderPickupAddresses
        await ctx.prisma.orderPickupAddress.deleteMany({
          where: {
            orderId: input.id,
          },
        });

        // 7. Delete all OrderClients
        await ctx.prisma.orderClient.deleteMany({
          where: {
            orderId: input.id,
          },
        });

        // 8. Finally, delete the order itself
        await ctx.prisma.order.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Order and all related data deleted successfully',
        };
      } else {
        // Regular delete for draft orders (cascade delete via foreign keys)
        await ctx.prisma.order.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Order deleted successfully',
        };
      }
    } catch (error) {
      throw new Error(
        `Failed to delete order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });
