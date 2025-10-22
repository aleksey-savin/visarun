import { currencyExchangeUpdateProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zUpdateCurrencyExchangeStatusTrpcInput = z.object({
    id: z.string().uuid(),
    status: z.enum([
        'draft',
        'in_progress',
        'finished',
        'cancelled',
    ]),
    cancelReason: z.string().optional(),
    canceledByClient: z.boolean().optional(),
});

export const updateCurrencyExchangeStatusTrpcRoute = currencyExchangeUpdateProcedure
    .input(zUpdateCurrencyExchangeStatusTrpcInput)
    .mutation(async ({ input, ctx }) => {
        const {
            id,
            status,
            cancelReason,
            canceledByClient,
        } = input;

        // Check if exchange exists
        const existingExchange = await ctx.prisma.currencyExchange.findUnique({
            where: { id },
        });

        if (!existingExchange) {
            throw new Error('Currency exchange not found');
        }

        // Cancelled status validation for cancel reason
        if (status != "cancelled" && cancelReason) {
            throw new Error("Cancel reason can be set only on 'cancelled' status");
        }

        // Cancel reason and canceled by client flag existence validation
        if (status == "cancelled" && (!cancelReason || canceledByClient === undefined)) {
            throw new Error("Cancel reason and canceled by client flag must be set on 'cancelled' status");
        }

        // Validate status transitions
        const currentStatus = existingExchange.status;
        const validTransitions: Record<string, string[]> = {
            draft: ['in_progress'],
            in_progress: ['finished', 'cancelled'],
            finished: [],
            cancelled: [],
        };

        // Allow same-status transitions
        const isSameStatus = currentStatus === status;
        const isValidTransition = validTransitions[currentStatus]?.includes(status);

        if (!isSameStatus && !isValidTransition) {
            throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
        }

        // Update currency exchange status
        const exchange = await ctx.prisma.currencyExchange.update({
            where: { id },
            data: {
                status,
                canceledByClient,
                cancelReason,
            },
        });

        return {
            exchange
        };
    });
