/*
TODO:
    1. Add permission in currencyExchangeDeleteProcedure
    2. Check deletion with transactions
 */


import { currencyExchangeDeleteProcedure } from '../../lib/trpc.js';
import { z } from 'zod';

export const zDeleteCurrencyExchangeTrpcInput = z.object({
    id: z.string().uuid(),
});

export const deleteCurrencyExchangeTrpcRoute = currencyExchangeDeleteProcedure
    .input(zDeleteCurrencyExchangeTrpcInput)
    .mutation(async ({ input, ctx }) => {
        // Check if exchange exists
        const existingExchange = await ctx.prisma.currencyExchange.findUnique({
            where: { id: input.id },
            include: {
                transactions: true,
            },
        });

        if (!existingExchange) {
            throw new Error('Currency exchange was not found');
        }

        // Check if exchange has related data
        const hasRelatedData = existingExchange.transactions.length > 0

        if (hasRelatedData) {
            throw new Error(
                'Cannot delete currency exchange with related transactions entries. Please remove related data first.'
            );
        }

        // Delete the exchange
        await ctx.prisma.currencyExchange.delete({
            where: { id: input.id },
        });

        return {
            success: true,
            message: 'Currency exchange deleted successfully',
        };
    });
