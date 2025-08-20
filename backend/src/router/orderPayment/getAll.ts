import { orderPaymentReadProcedure } from '../../lib/trpc.js';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const zGetAllOrderPaymentsInput = z.object({
  orderId: z.string().uuid().optional(),
  currencyId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'transfer']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional(),
});

export const getAllOrderPaymentsTrpcRoute = orderPaymentReadProcedure
  .input(zGetAllOrderPaymentsInput)
  .query(async ({ input, ctx }) => {
    const { orderId, currencyId, paymentMethod, dateFrom, dateTo, limit = 50, offset = 0 } = input;

    const where: Prisma.OrderPaymentWhereInput = {};

    if (orderId) {
      where.orderId = orderId;
    }

    if (currencyId) {
      where.currencyId = currencyId;
    }

    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      where.paidAt = {};
      if (dateFrom) {
        where.paidAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.paidAt.lte = new Date(dateTo);
      }
    }

    const [orderPayments, total] = await Promise.all([
      ctx.prisma.orderPayment.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          amount: true,
          currencyId: true,
          paidAt: true,
          paymentMethod: true,
          documentUrl: true,
          acceptedBy: true,
          acceptedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          order: {
            select: {
              id: true,
              status: true,
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
          currency: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      ctx.prisma.orderPayment.count({ where }),
    ]);

    return {
      orderPayments,
      total,
      hasMore: offset + limit < total,
    };
  });
